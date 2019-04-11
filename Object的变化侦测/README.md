### 如何追踪变化

在 JavaScript 中，要想侦测一个对象的变化，可以使用 `Object.defineProperty` 和 ES6 的 `Proxy`。不熟悉的同学可以点击：

- [Object.defineProperty](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)
- [Proxy](http://es6.ruanyifeng.com/#docs/proxy)

目前 Vue 2.X 版本中使用的还是 `Object.defineProperty` ，但是由于其用来侦测变化会有诸多缺陷：无法监听深层数据的改变、数组索引或长度的变更等等，所以 Vue.js 的作者尤雨溪说日后会使用 `Proxy` 重写这部分代码。

但是无论实现的方式怎样变化，其原理和思想基本都不会改变，重新梳理下 Object 变化侦测的过程对我们没有坏处。言归正传，知道了 `Object.defineProperty` 可以侦测到对象的变化，那么我们可以写出以下代码：

```javascript
function defineReactive(data, key, val) {
    Object.defineProperty(data, key, {
        enumerable: true,
        configurable: true,
        get() {
            return val;
        },
        set(newVal) {
            if(newVal === val) {
                return;
            }
            val = newVal;
        }
    })
}
```

函数 `defineReactive` 用来对 `Object.defineProperty` 进行封装，每当从 `data` 中的 `key` 读取数据时，`get` 函数被触发；每当往 `data` 中的 `key` 设置数据时，`set` 函数被触发。

### 如何收集依赖

Vue 中的双向数据绑定是通过数据劫持跟发布订阅模式相结合来实现的，如果只是把 `Object.defineProperty` 进行封装，实际上是没有什么用处的，我们还需要收集依赖，每当数据发生变化时，可以同步通知到这些依赖。

举个例子：

```html
<template>
  <h1>{{ name }}</h1>
</template>
```

该模板中使用了数据 `name`，所以当它发生变化时，要向是用了它的地方发送通知。因此，我们需要先收集依赖，即把用到的数据 `name` 的地方收集起来，当 `name` 属性发生变化时，把之前收集好的依赖循环触发一遍就好啦。

> 注意，在 Vue.js 2.0 中，模板使用数据等同于组件使用数据，所以当数据发生变化时，会将通知发送到组件，然后组件内部再通过虚拟 DOM 重新渲染。

总结一句话就是，在 `getter` 中收集依赖，在 `setter` 中触发依赖。

### 依赖收集到哪里

每个对象都有不同的 `key`，那么我们可以给每个 `key` 新增一个数组，用来存储当前的依赖。假设依赖是一个函数，保存在 `window.target` 上，再把 `defineReactive` 函数稍微改造一下。

```javascript
function defineReactive(data, key, val) {
    // 新增
    let dep = [];
    Object.defineProperty(data, key, {
        enumerable: true,
        configurable: true,
        get() {
            dep.push(window.target);
            return val;
        },
        set(newVal) {
            if(newVal === val) {
                return;
            }
            // 新增
            for(let i = 0, len = dep.length; i < len; i++) {
                dep[i](newVal, val)
            }
            val = newVal;
        }
    })
}
```

这里使用了数组 `dep`，用来存储被收集的依赖。

但是这样写有点耦合，所以我们需要把依赖收集的代码单独封装成一个 `Dep` 类，代码如下：

```javascript
class Dep {
    constructor() {
        // 存储依赖的数组
        this.subs = [];
    }

    addSub(sub) {
        this.subs.push(sub);
    }

    removeSub(sub) {
        remove(this.subs, sub);
    }

    depend() {
        if(Dep.target) {
            this.addSub(Dep.target);
        }
    }

    notify() {
        const subs = this.subs.slice();
        for(let i = 0, len = subs.length; i < len; i++) {
            subs[i].update();
        }
    }
}

Dep.target = null;

function remove(arr, item) {
    if(arr.length) {
        const index = arr.indexOf(item);
        if(index > -1) {
            return arr.splice(index, 1);
        }
    }
}
```

再来修改下 `defineReactive` 函数：

```javascript
function defineReactive(data, key, val) {
    let dep = new Dep();
    Object.defineProperty(data, key, {
        enumerable: true,
        configurable: true,
        get() {
            dep.depend();
            return val;
        },
        set(newVal) {
            if(newVal === val) {
                return;
            }
            val = newVal;
            dep.notify();
        }
    })
}
```

为了不污染全局变量，这里我把 `window.target` 改成了 `Dep.target`。

### 依赖是谁

在上面的代码中，我们收集到的依赖是 `Dep.target`，那么它到底是什么？

收集谁，换句话说，就是当属性发生变化后，通知谁，我们暂时就叫它 `Watcher` 吧。

### 什么是 Watcher

`Watcher` 是一个中介的角色，数据发生变化时通知它，它在通知其他地方。

我们先来回顾下在 `Vue` 中是怎么使用 `Watcher` 的：

```javascript
vm.$watch('a.b.c', function(newVal, oldVal) {
  // 做点什么
})
```

这段代码表示当 `data.a.b.c` 属性发生变化时，触发第二个参数中的函数。

那么怎么实现呢？好像只要把这个 `Watcher` 实例添加到 `data.a.b.c` 属性的 `Dep` 中就行了，当值发生变化时，通知 `Watcher`，`Watcher` 再执行参数中的回调函数。

```javascript
class Watcher {
    constructor(vm, exp, cb) {
        this.vm = vm;
        this.getter = parsePath(exp);
        this.cb = cb;
        this.value = this.get();
    }

    get() {
        Dep.target = this;
        let value = this.getter.call(this.vm, this.vm);
        Dep.target = null;
        return value;
    }

    update() {
        let value = this.get();
        let oldVal = this.value;
        if(value !== oldVal) {
            this.value = value;
            this.cb.call(this.vm, value, oldVal);
        }
    }
}
```

再写个 `parsePath` 函数去读取字符串 `exp` 的值。

```javascript
function parsePath(path) {
    return function(obj) {
        let paths = path.split('.');
        for(let i = 0, len = paths.length; i < len; i++) {
            if(!obj) {
                return;
            }
            obj = obj[paths[i]]
        }
        return obj;
    }
}
```

下面我们先简单尝试一下：

```javascript
var person = {
    name: 'dashan'
}

defineReactive(person, 'name', 'dashan');

new Watcher(person, 'name', function(newVal, oldVal) {
    console.log(newVal, oldVal);
})

person.name = 'test'; // test dashan
person.name = 'test2'; // test2 test
```

可以看到，我们已经实现了简易版的对象变化侦测，但是怎样才能把对象中的所有属性（包括子属性）都侦测到呢？答案就是封装一个 `Observer` 类，将一个对象内的所有属性（包括子属性）都转换成 `getter/setter` 的形式，然后追踪它的变化。

### 递归侦测所有 key

封装 `Observer` 类代码如下：

```javascript
/**
 * Observer类会附加到每一个被侦测的 object 上
 * 一旦被附加上，Observer 会将 object 的所有属性转换为 getter/setter 形式
 * 来收集属性的依赖，并且当属性发生变化时会通知这些依赖
 */

class Observer {
    constructor(value) {
        this.value = value;

        if(!Array.isArray(value)) {
            this.walk(value);
        }
    }

    walk(obj) {
        const keys = Object.keys(obj);
        for(let i = 0, len = keys.length; i < len; i++) {
            defineReactive(obj, keys[i], obj[keys[i]]);
        }
    }
}
```

再改写下 `defineReactive` 函数:

```javascript
function defineReactive(data, key, val) {
    if(typeof val === 'object') { // 新增，递归子属性
        new Observer(val);
    }
    let dep = new Dep();
    Object.defineProperty(data, key, {
        enumerable: true,
        configurable: true,
        get() {
            dep.depend();
            return val;
        },
        set(newVal) {
            if(newVal === val) {
                return;
            }
            val = newVal;
            dep.notify();
        }
    })
}
```

再来测试一下：

```javascript
var person = {
    name: 'dashan',
    age: 18
}

new Observer(person);

new Watcher(person, 'name', function(newVal, oldVal) {
    console.log(newVal, oldVal);
})

new Watcher(person, 'age', function(newVal, oldVal) {
    console.log(newVal, oldVal);
})

person.name = 'test'; // test dashan
person.name = 'test2'; // test2 test

person.age = 28; // 28 18
```

### 关于 Object 的问题

我们开头也说过， Vue.js 通过 `Object.defineProperty` 来追踪变化有诸多缺陷，比如 `getter/setter` 只能追踪一个数据是否被修改，无法追踪到新增属性和删除属性，为了解决这个问题，Vue.js 提供了两个 API——vm.$set 与 vm.$delete，后续我们会详细介绍它们。

### 总结

变化侦测就是侦测数据的变化。当数据发生变化时，要能侦测到并发出通知。

`Object` 可以通过 `Object.defineProperty` 将属性转换成 `getter/setter` 形式来追踪变化，读取数据时触发 `getter`，设置数据时触发 `setter`。

我们需要在 `getter` 中收集有哪些依赖使用了数据，当 `setter` 被触发时，去通知 `getter` 中收集的依赖数据发生了变化。

收集依赖数据需要找一个存储的地方，为此我们创建了 Dep，用来收集依赖、删除依赖和通知依赖。

所谓的依赖，就是 `Watcher`。只有 `Watcher` 触发的 `getter` 才会收集依赖，当数据发生变化时，会循环 `Dep` 中的依赖列表，把所有的 `Watcher` 都通知一遍。

`Watcher` 的原理是先把自己设置全局唯一的变量（例如上文中的 `Dep.target`），然后读取数据。因为读取了数据，就会触发这个数据的 `getter`，接着，在 `getter` 中就会从全局唯一变量读取当前数据的 `Watcher`，并把这个 `Watcher` 收集到 `Dep` 中去。

最后，我们创建了 `Observer` 类，它的作用是把一个 `object` 中所有的属性（包括子属性）都转换成响应式，从而侦测所有数据的变化。

![image](https://user-images.githubusercontent.com/36752487/55949365-02ddb200-5c85-11e9-8d7b-a5f749c23347.png)
