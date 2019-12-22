var fetch = require('node-fetch');
var redis = require('redis'),
	client = redis.createClient();
const { promisify } = require('util');
const setAsync = promisify(client.set).bind(client);

const baseUrl = 'https://jobs.github.com/positions.json';

async function fetchGitHub() {
	let resultCount = 1,
		onPage = 0;
	const allJobs = [];

	// Fetch all pages
	while (resultCount > 0) {
		const res = await fetch(`${baseUrl}?page=${onPage}`);
		const jobs = await res.json();
		allJobs.push(...jobs);
		resultCount = jobs.length;
		console.log('got ', resultCount, ' jobs');
		onPage++;
	}
	console.log('got ', allJobs.length, ' jobs total');

	// filter algorithm
	const jrJobs = allJobs.filter(job => {
		const jobTitle = job.title.toLowerCase();

		// algorithm logic
		if (
			jobTitle.includes('senior') ||
			jobTitle.includes('manager') ||
			jobTitle.includes('sr.') ||
			jobTitle.includes('architect')
		) {
			return false;
		}

		return true;
	});
	console.log('filtered down to', jrJobs.length, ' junior jobs');

	// Set in redis
	const success = await setAsync('github', JSON.stringify(jrJobs));
	console.log({ success });
}

module.exports = fetchGitHub;
