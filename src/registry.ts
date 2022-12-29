export class OperatorRegistry<T extends object> {
    private constructor(private registry: T) { }
    
    register<K extends string, S>(key: K, service: S): OperatorRegistry<Record<K, S> & T> {    
        // add service to registry and return the same object with a narrowed type
        (this.registry as any)[key] = service;
        return this as any as OperatorRegistry<Record<K, S> & T>;
    }

    get<K extends keyof T>(key: K): T[K] {
        if (!(key in this.registry)) {
          throw new Error(`Invalid type ${String(key)}`);
        }
        return this.registry[key];
    }
    
    static create(): OperatorRegistry<{}> {
        return new OperatorRegistry({});
    }
}