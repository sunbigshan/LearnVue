const hasProto = '__proto__' in {};
const arraykeys = Object.getOwnPropertyNames(arrayMethods);

class Observer {
    constructor(value) {
        this.value = value;

        if(Array.isArray(value)) {
            if(hasProto) {
                value.__proto__ = arrayMethods;
            }else{
                copyAugument(value, arrayMethods, arraykeys)
            }
        }else{
            this.walk(value);
        }
    }

    walk(obj) {
        Object.keys(obj).forEach((key) => {
            defineReactive(obj, key, obj[key]);        
        })
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
            dep.notify()
        }
    })
}