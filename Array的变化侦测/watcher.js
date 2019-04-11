class Watcher {
    constructor(vm, exp, cb) {
        this.vm = vm;
        this.cb = cb;
        this.getter = parsePath(exp);

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

function parsePath(path) {
    return function(obj) {
        const paths = path.split('.');
        for(let i = 0, len = paths.length; i < len; i++) {
            if(!obj) {
                return;
            }
            obj = obj[paths[i]];
        }
        return obj;
    }
}