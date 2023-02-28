type Effect = () => void
type DependencyList = Set<Effect>
type DependencyMap = Map<any, DependencyList>
type TargetMap = WeakMap<{}, DependencyMap>

const targetMap: TargetMap = new WeakMap() //Connects pieces of state with dependencies
let activeEffect: any = null

function track(target: any, key: any) {
  if (activeEffect) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }
    let dep = depsMap.get(target)
    if (!dep) {
      depsMap.set(key, (dep = new Set()))
    }
    depsMap.set(key, dep)
    dep.add(activeEffect)
  }
}

function trigger(target: any, key: any) {
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    return
  }
  let dep = depsMap.get(key)
  if (dep) {
    dep.forEach((effect: () => void) => {
      effect()
    })
  }
}

export function reactive(target: any) {
  const handler = {
    get(target: any, key: string, receiver: unknown) {
      track(target, key)
      return Reflect.get(target, key, receiver)
    },
    set(target: any, key: string, value: any, receiver: unknown) {
      let oldValue = target[key]
      let result = Reflect.set(target, key, value, receiver)
      if (result && oldValue !== value) {
        trigger(target, key)
      }
      return result
    },
  }
  return new Proxy(target, handler)
}

export function ref(initialValue: any) {
  const reference = {
    get value() {
      track(reference, 'value')
      return initialValue
    },
    set value(newValue) {
      initialValue = newValue
      trigger(reference, 'value')
    },
  }
  return reference
}
