class Observer {
    constructor(data) {
        this.data = data;

        if(!Array.isArray(data)) {
            this.walk(data);            
        }
    }

    walk(obj) {
        const keys = Object.keys(obj);
        keys.forEach((key) => {
            defineReactive(obj, key, obj[key]);
        })
    }
}

function defineReactive(data, key, val) {
    if(typeof val === 'object') {
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

class Dep {
    constructor() {
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
        subs.forEach((sub) => {
            sub.update();
        })
    }
}

Dep.target = null;

class Watcher {
    constructor(vm, expOrFn, cb) {
        this.vm = vm;
        this.expOrFn = expOrFn;
        this.cb = cb;

        if(typeof expOrFn === 'function') {
            this.getter = expOrFn;
        }else{
            this.getter = parseGetter(expOrFn.trim());
        }

        this.value = this.get();
    }

    update() {
        let value = this.get();
        let oldVal = this.value;
        if(value !== oldVal) {
            this.value = value;
            this.cb.call(this.vm, value, oldVal);
        }
    }

    get() {
        Dep.target = this;
        let value = this.getter.call(this.vm, this.vm);
        Dep.target = null;
        return value;
    }
}

function parseGetter(exp) {
    let reg = /[^\w.$]/;
    if(reg.test(exp)) {
        return;
    }

    let exps = exp.split('.');

    return function(obj) {
        for(let i = 0, len = exps.length; i < len; i++) {
            if(!obj) {
                return;
            }
            obj = obj[exps[i]];
        }
        return obj;
    }
}

function remove(arr, item) {
    if(arr.length) {
        const index = arr.indexOf(item);
        if(index > -1) {
            return arr.splice(index, 1);
        }
    }
}


var person = {
    name: 'dashan'
}

new Observer(person);

new Watcher(person, 'name', function(newVal, oldVal) {
    console.log(newVal, oldVal);
})

person.name = 'test';
person.name = 'test2';
