class Timer {
	time = {
		hour: 0,
		minute: 1,
		second: 0,
	};

	counting = false;

	display() {
		this.displayPane.textContent = this.getTimeString();
	}

	constructor(startButton, pauseButton, displayPane, callbacks) {
		this.startButton = startButton;
		this.pauseButton = pauseButton;
		this.displayPane = displayPane;

		if (callbacks) {
			this.onStart = callbacks.onStart;
			this.onStop = callbacks.onStop;
			this.onTick = callbacks.onTick;
			this.onComplete = callbacks.onComplete;
		}

		this.pauseButton?.addEventListener('click', () => {
			this.stop();
		});
		this.startButton?.addEventListener('click', () => {
			this.start();
		});

		navigator.getBattery().then((battery) => {
			this.battery = battery;
		});
	}

	reset() {
		this.pause();
		this.setTime({ hour: 0, minute: 0, second: 0 });
	}

	setTime(data) {
		this.time = data;
		this.display();
	}

	tick() {
		let { hour, minute, second } = this.time;

		if (second < 1) {
			if (minute > 0) {
				minute--;
				second = 59;
			} else {
				if (hour > 0) {
					hour--;
					minute = 59;
					second = 59;
				}
			}
		} else {
			second--;
		}

		if (hour == 0 && minute == 0 && second == 0) {
			this.pause();
			this.completed = true;
		}

		this.time = { hour, minute, second };
	}

	getTime() {
		return this.time;
	}

	getTimeString() {
		const { hour, minute, second } = this.getTime();
		return `${hour.toString().padStart(2, '0')}:${minute
			.toString()
			.padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
	}

	start() {
		this.displayPane.textContent = this.getTimeString();
		this.counting = true;
		this.interval = setInterval(() => {
			this.tick();
			this.displayPane.textContent = this.getTimeString();
		}, 1000);

		if (this.onStart) {
			this.onStart();
		}
	}

	pause() {
		clearInterval(this.interval);
		this.counting = false;
	}

	stop() {
		this.pause();
		if (this.onStop) {
			this.onStop();
		}
	}
}

class BatteryWatcher {
	/**
	 * @param {Timer} timer
	 */
	constructor(timer) {
		this.timer = timer;
		this.interval = null;

		navigator.getBattery().then((battery) => {
			this.battery = battery;
		});
	}

	startWatch() {
		if (!this.interval) {
			this.interval = setInterval(() => {
				if (!this.checkBattery()) {
					if (this.timer.counting) this.timer.pause();
				} else {
					if (!this.timer.counting) this.timer.start();
				}
			}, 500);
		}
	}

	stopWatch() {
		clearInterval(this.interval);
	}

	checkBattery() {
		const { charging, level } = this.battery;
		console.log(charging, level);
		return this.battery.charging; // || this.battery.level > 0.1;
	}
}

document.addEventListener('DOMContentLoaded', () => {
	const timer = new Timer(
		document.querySelector('#start-timer'),
		document.querySelector('#stop-timer'),
		document.querySelector('#timer-display'),
		{
			onStart: () => {
				watcher.startWatch();
			},
			onStop: () => {
				timer.reset();
				watcher.stopWatch();
			},
		}
	);

	const watcher = new BatteryWatcher(timer);

	document.querySelector('#reset-timer').addEventListener('click', () => {
		timer.reset();
	});

	const display = document.querySelector('#timer-display');
	display.textContent = timer.getTimeString();

	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.register('sw.js');
	}

	document.querySelector('#timer-form').addEventListener('submit', (e) => {
		e.preventDefault();
		const hour = parseInt(e.target.elements['hours-input'].value || '0');
		const minute = parseInt(e.target.elements['minutes-input'].value || '0');
		const second = parseInt(e.target.elements['seconds-input'].value || '0');

		timer.setTime({ hour, minute, second });
	});
});
