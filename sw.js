const cacheName = 'v1';
const cacheList = ['/', '/index.js', '/style.css', '/sw.js'];

self.addEventListener('install', function (event) {
	event.waitUntil(
		caches.open(cacheName).then((cache) => {
			return cache.addAll(cacheList);
		})
	);
});

self.addEventListener(
	'activate',
	/**
	 *
	 * @param {ActivateEvent} event
	 */
	function (event) {
		event.waitUntil(
			caches.keys().then(function (cacheNames) {
				return Promise.all(
					cacheNames.map(function (cache) {
						if (cache !== cacheName) {
							return caches.delete(cache);
						}
					})
				);
			})
		);
	}
);

self.addEventListener('fetch', function (event) {
	event.respondWith(
		fetch(event.request)
			.then(function (response) {
				const responseClone = response.clone();
				if (responseClone.url in cacheList) {
					caches.open(cacheName).then(function (cache) {
						cache.put(event.request, responseClone);
					});
				}
				return response;
			})
			.catch(async function () {
				const response = await caches.match(event.request);
				if (response) {
					return response;
				} else {
					return caches.match('/');
				}
			})
	);
});
