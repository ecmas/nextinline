'use strict';

const { StringDecoder } = require('string_decoder');
const lineEnding = /\r?\n|\r(?!\n)/;

class NextLine {
	constructor(input) {
		this._input = input;
		this._decoder = new StringDecoder('utf8');
		this._lines = [];
		input.resume();
	}

	_read() {
		const self = this;
		if (self._input.readableEnded) {
			return null;
		}
		return new Promise((resolve, reject) => {
			self._input.once('readable', () => {
				resolve(self._input.read());
			});
		});
	}

	async next() {
		if (this._lines.length > 1) {
			return this._lines.shift();
		}
		if (this.finished) {
			return this._lines.shift();
		}
		for (; ;) {
			let b = await this._read();
			if (!b) {
				this.finished = true;
			}
			let string = b ? this._decoder.write(b) : this._decoder.end();
			if (this._lines.length) {
				string = this._lines[0] + string;
			}
			this._lines = string.split(lineEnding);
			if (this._lines.length > 1) {
				return this._lines.shift();
			}
			if (this.finished) {
				// last line
				return this._lines.shift();
			}
		}
	}
}

module.exports = NextLine;
