const hasProto = '__proto__' in {};
const arraykeys = Object.getOwnPropertyNames(arrayMethods);

class Observer {
    constructor(value) {
        this.value = value;
        this.dep = new Dep();
        def(value, '__ob__', this);
        if(Array.isArray(value)) {
            if(hasProto) {
                value.__proto__ = arrayMethods;
            }else{
                copyAugument(value, arrayMethods, arraykeys)
            }
            this.observeArray(value);
        }else{
            this.walk(value);
        }
    }

    walk(obj) {
        Object.keys(obj).forEach((key) => {
            defineReactive(obj, key, obj[key]);        
        })
    }

    observeArray(items) {
        for(let i = 0, len = items.length; i < len; i++) {
            observe(items[i]);
        }
    }
}

function copyAugument(target, src, keys) {
    for(let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i];
        def(target, key, src[key]);
    }
}

function defineReactive(data, key, val) {
    if(typeof val === 'object') {
        new Observer(val);
    }
    let childOb = observe(val);
    let dep = new Dep();
    Object.defineProperty(data, key, {
        enumerable: true,
        configurable: true,
        get() {
            dep.depend();
            if(childOb) {
                childOb.dep.depend();
            }
            return val;
        },
        set(newVal) {
            if(newVal === val) {
                return;
            }
            val = newVal;
            dep.notify()
        }
    })
}

function observe(value) {
    if(!isObject(value)) {
        return;
    }
    let ob;
    if(hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
        ob = value.__ob__;
    }else{
        ob = new Observer(value);
    }
    return ob;
}