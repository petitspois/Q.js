var _ = require('./utils');

module.exports = {
    show: function (value) {
        var el = this.el;
        if (value) el.style.display = 'block';
        else el.style.display = 'none';
    },
    'class': function (value) {
        var el = this.el,
            arg = this.arg;
        value ?
            _.addClass(el, arg) :
            _.removeClass(el, arg);
    },
    value: function (value) {
        var el = this.el;
        if (el.type === 'checkbox') {
            el.checked = value;
        } else {
            el.value = value;
        }
    },
    attr: function (value) {
        if (value === undefined) return;
        var arg = this.arg,
            el = this.el;
        // property
        if (arg in el) {
            el[arg] = value;
        } else {
            el.setAttribute(arg, value);
        }
    },
    text: function (value) {
        value !== undefined &&
            (this.el.innerText = value);
    },
    on: {
        bind: function () {
            var key = this.target || this.exp.match(/^[\w\-]+/)[0],
                expression = this.exp,
                filters = this.filters,
                vm = this.vm,
                handler = vm.applyFilters(this.vm[key], filters),
                data = this.namespace ?
                    vm.data(this.namespace) :
                    vm;
            _.add(this.el, this.arg, function (e) {
                if (!handler || typeof handler !== 'function') {
                    return _.warn('You need implement the ' + key + ' method.');
                }
                expression ?
                    handler.call(vm, data) :
                    handler.apply(vm, arguments);
            });
        }
    },
    model: {
        bind: function () {
            var key = this.target,
                namespace = this.namespace || '',
                el = this.el,
                vm = this.vm;
            _.add(el, 'input onpropertychange change', function (e) {
                vm.data(namespace).$set(key, el.value);
            }, vm);
        },
        update: function (value) {
            this.el.value = value;
        }
    },
    vm: {
        bind: function () {
            // remove q-vm
            this.el.removeAttribute('q-vm');
            // stop walk
            this.setting.stop = true;

            // which component
            var name = this.target,
                vm = this.vm,
                el = this.el,
                // component reference
                ref = el.getAttribute('q-ref') || false,
                key = el.getAttribute('q-with') || '',
                namespace = this.namespace,
                target = namespace ? ([namespace, key].join('.')) : key,
                data = vm.data(target),
                childVm = new (vm.constructor.require(name))({
                    el: el,
                    data: data.$get()
                });

            vm._children.push(childVm);
            ref && !function () {
                var refs = vm.$[ref];
                refs ?
                    refs.length ?
                        (refs.push(childVm)) :
                        (vm.$[ref] = [refs, childVm]) :
                    (vm.$[ref] = childVm);
            }();

            // unidirectional binding
            vm.$on('datachange', function (prop) {
                if (!target || ~prop.indexOf(target)) {
                    var start = target.length,
                        childProp;

                    start && (start += 1);
                    childProp = prop.substring(start, prop.length);
                    childVm.$set(childProp, vm.data(prop));
                }
            });
        }
    },
    repeat: require('./repeat')
};
