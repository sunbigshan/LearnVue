class Observer {
    constructor(value) {
        this.value = value;

        if(Array.isArray(value)) {
            
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
            dep.nodify()
        }
    })
}