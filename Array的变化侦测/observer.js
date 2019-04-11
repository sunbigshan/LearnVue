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