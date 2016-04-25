/**
* A chronometer object, hoping to provide fine-grained time measurements
*/

function Chrono(){
	var totalDuration = 0;
	var interval;
	var startTime, stopTime;

	var nowFn = (window.performance && window.performance.now) || Date.now;

	/**
	* Start a time measurement
	* If a time measurement is already ongoing, this method doesn't do anything (not even throwing an error)
	*/
	this.start = function(){
		startTime = startTime || nowFn();
	};

	/**
	* Stop an ongoing time measurement and adds this latest measurement's elapsed time to elapsedTime
	* Returns -1 if no time measurement is ongoing
	* Returns the total elasped time otherwise
	*/
	this.stop = function(){
		if (!startTime) return -1;
		stopTime = nowFn();

		interval = stopTime - startTime;
		totalDuration += interval;
		startTime = 0;

		return totalDuration;
	};

	/**
	* Returns the total elasped time (summing all "measurements" done this instance)
	* Returns -1 if a measurement is ongoing
	*/
	this.elapsedTime = function(){
		if (startTime) return -1;
		return totalDuration;
	};

	/**
	* Reset the Chrono instance
	* Doesn't reset the instance if a measurement is ongoing (and returns -1 in this case)
	*/
	this.reset = function(){
		if (startTime) return -1;
		totalDuration = 0;
	};
}
