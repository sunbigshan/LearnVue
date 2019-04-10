class Observer {
    constructor(data) {
        this.data = data;
        if(!Array.isArray(data)) {
            this.walk(data);
        }
    }
    
    walk(data) {
        Object.keys(data).forEach((key) => {
            defineReactive(data, key, data[key]);
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
            if(Dep.target) {
                dep.depend();
            }
            return val;
        },
        set(newVal) {
            if(newVal === val) {
                return;
            }
            val = newVal;
            if(typeof newVal === 'object') {
                new Observer(newVal);
            }
            dep.notify();
        }
    })
}

