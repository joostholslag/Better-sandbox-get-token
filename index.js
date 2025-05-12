// This collection is intented for use with Better Platfrom Sandbox https://sandbox.better.care
// script checks for token existance and validity and fetches access token
// set variables sandboxUsername and sandboxPassword in postman vault
// Environment variables are required: ehrApiUrl, openEhrApiUrl, terminologyUrl, demographicsUrl, getTokenUrl

function tokenExists() {
	var token = pm.environment.get('sandboxToken')
	return (token != undefined) && (token != "")
}

function getTokenPayload(token) {

return JSON.parse(
	Buffer.from(token.split('.')[1], "base64").toString()
);
}

function isTokenValid() {
	if (tokenExists()) {
		var token = getTokenPayload(pm.environment.get('sandboxToken'))
		return Math.round((new Date() / 1000)) < token.exp;
	} else {
		return false
	}
}

async function getNewToken() {

	var username = await pm.vault.get('sandboxUsername')
	if (!username) {
		console.log("Cannot fetch token. Username not set, please set varaible 'sandboxUsername'");
		return null;
	}

	var password = await pm.vault.get("sandboxPassword")
	if (!password) {
		console.log("Cannot fetch token. Password not set, please set variable 'sandboxPassword'")
		return null;
	}

	pm.sendRequest({
		url: pm.variables.replaceIn(pm.environment.get('getTokenUrl')),
		method: 'POST',
		header: {
			'Content-Type': 'application/x-www-form-urlencoded', 'Accept': '*/*',
			'Allow': 'application/json', 'Accept-Encoding': 'gzip, deflate, br'
		},
		body: {
			mode: 'urlencoded',
			urlencoded: [
				{ key: 'grant_type', value: 'password' }, { key: 'client_id', value: 'portal' },
				{ key: 'username', value: username }, { key: 'password', value: password }]
		}
	}, function (err, response) {
		if (!err) {
			var jsonData = response.json();
			if (jsonData.error) {
				console.error(jsonData.error)
			} else {
				pm.environment.set('sandboxToken', jsonData.access_token)
				console.log("New access token fetched for: " + username)
				console.log(getTokenPayload(pm.environment.get('sandboxToken')))
			}
		} else {
			console.error(err)
		}
	});
}

if (!isTokenValid()) {
	getNewToken()
}
