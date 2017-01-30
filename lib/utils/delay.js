export default function(duration) {
	return function() {
		return new Promise(function(resolve, reject){
			setTimeout(() => resolve(), duration)
		})
	}
}
