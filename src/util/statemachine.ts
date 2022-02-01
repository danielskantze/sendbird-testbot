type Listener = {
    state:string,
    callback:() => void
}

export default class StateMachine {
    private _states:Set<string>;
    private _initialState:string;
    private _currentState:string;
    private _transitions:Set<string>;
    private _listeners:Array<Listener>;
    private _stateChangeListeners:Array<(state:string) => void>;

    constructor(states:Array<string>, initialState:string) {
        this._states = new Set<string>();
        this._transitions = new Set<string>();
        this._initialState = initialState;
        this._listeners = [];
        this._stateChangeListeners = [];
        states.forEach(s => { this._states.add(s); });
        this.reset();
    }
    get currentState():string {
        return this._currentState;
    }
    private _getTransition(from:string, to:string):string {
        return [from, to].join(';');
    }

    is(state:string):boolean {
        return this.currentState === state;
    }
    isOneOf(states:Array<string>):boolean {
        return !states.find(s => this.currentState === s);
    }
    reset() {
        this._currentState = this._initialState;
    }
    /**
     * Adds a directed valid state transition between two states
     * 
     * @param from 
     * @param to 
     */
    addTransition(from:string, to:string) {
        this._transitions.add(this._getTransition(from, to));
    }
    /**
     * Adds multiple directed valid state transitions between one state and a list of other states
     * 
     * @param from Add transtions from this state
     * @param to Add a transition to each of these states
     */
     addTransitions(from:string, states:Array<string>) {
        states.forEach(to => { this.addTransition(from, to); });
    }
    /**
     * Adds a listener that triggers when a certain state is reached 
     * 
     * @param state 
     * @param callback 
     */
    addStateListener(state:string, callback:() => void) {
        this._listeners.push({state, callback});
    }
    /**
     * Adds a listener that triggers when any of the supplied states is reached 
     * 
     * @param state 
     * @param callback 
     */    
    addStateListeners(states:Array<string>, callback:() => void) {
        states.forEach(state => {
            this._listeners.push({state, callback});    
        })
    }
    /**
     * Adds a listener that triggers each time the state changes
     * 
     * @param callback 
     */
    addStateChangeListener(callback:(state:string) => void) {
        this._stateChangeListeners.push(callback);
    }
    removeStateChangeListener(callback:(state:string) => void) {
        for (let i = 0; i < this._stateChangeListeners.length; i++) {
            if (this._stateChangeListeners[i] === callback) {
                this._stateChangeListeners.splice(i, 1);
                return;
            }
        }
    }
    removeStateListener(state:string, callback:() => void) {
        for (let i = 0; i < this._listeners.length; i++) {
            if (this._listeners[i].state === state && this._listeners[i].callback === callback) {
                this._listeners.splice(i, 1);
                return;
            }
        }
    }
    removeStateListeners(states:Array<string>, callback:() => void) {
        states.forEach(s => {
            this.removeStateListener(s, callback);
        });
    }
    private _notifyListeners(state:string) {
        this._listeners
            .filter(l => l.state === state)
            .forEach(l => l.callback());
        this._stateChangeListeners.forEach(c => c(state));
    }
    /**
     * Change state. Will succeed if the state transition previously has been added
     * 
     * @param nextState 
     * @returns true if the state was changed, false otherwise
     */
    changeState(nextState:string):boolean {
        if (this._transitions.has(this._getTransition(this._currentState, nextState))) {
            this._currentState = nextState;
            this._notifyListeners(this._currentState);
            return true;
        }
        return false;
    }
}