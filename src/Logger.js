export default class Logger {

	constructor(instance) {
		this.componentName = typeof instance === "string" ? instance : instance.constructor.name;
	}

	log(...args) {
		args.splice(0, 0, "-");
		args.splice(0, 0, this.componentName);
		console.log.apply(console, args)
	}

	error(...args) {
		args.splice(0, 0, "-");
		args.splice(0, 0, this.componentName);
		console.error.apply(console, args)
	}
}
