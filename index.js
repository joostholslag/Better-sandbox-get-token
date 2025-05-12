// This collection is intented for use with Better Platfrom Sandbox https://sandbox.better.care
// script checks for token existance and validity and fetches access token
// set variables sandboxUsername and sandboxPassword in Environmet or API Collection/Varaibles
// Environment variables are required: ehrApiUrl, openEhrApiUrl, terminologyUrl, demographicsUrl, getTokenUrl
  
//Requires authType Environeant variable to be set to

// Basic => Needs valid Username and Password
// Token => Needs snadboxUserName, sandBoxPassword, sandboxToken(initially empty), getTokenUrl

addAuthTokenString() //Needs to be a root-level of script

const getBasicAuthString = (pm) => {
    const username = pm.environment.get('Username')
    const password = pm.environment.get('Password')
    const token = btoa(`${username}:${password}`)
    return `Basic ${token}`
}

async function getTokenAuthString(pm){
   if (!isTokenValid()) 
        await getNewToken()
   const token = pm.environment.get("sandboxToken")
   return `Bearer ${token}`
}

async function addAuthTokenString(pm) {
	console.log(pm)
	console.log('something nice')
    let authTokenString = null;
    const authType = pm.environment?.get("authType");
    switch(authType) {
     case "Token":
        authTokenString = await getTokenAuthString()
        break;  
     case "Basic":
        authTokenString = getBasicAuthString()
        break;
     default:
        authTokenString = null
    }

    if(authTokenString) {
        pm.request.headers.add({
        key: "Authorization",
        value: `${authTokenString}`
    })
    }
    else
      console.error('Invalid Auth type')
}

function tokenExists(pm) {
  var token = pm.environment.get('sandboxToken')
  return (token != undefined) && (token != "") 
}

function getTokenClaims(token) {
    return JSON.parse(atob(token.split('.')[1]))
}

function isTokenValid(pm) {
  if (tokenExists()) {
    var token = getTokenClaims(pm.environment.get('sandboxToken'))
    return Math.round((new Date() / 1000)) < token.exp;
  } else {
    return false
  }
}

async function getNewToken() {

    var username = pm.variables.get('sandboxUsername')

    if(!username) {
        console.log("Cannot fetch token. Username not set, please set varaible 'sandboxUsername'");
        return null;
    }

    var password = pm.variables.get('sandboxPassword') 
    if(!password) {
        console.log("Cannot fetch token. Password not set, please set variable 'sandboxPassword'")
        return null;
    }
  
  await pm.sendRequest({
    url: pm.variables.replaceIn(pm.environment.get('getTokenUrl')),
    method: 'POST',
    header: {
        'Content-Type': 'application/x-www-form-urlencoded','Accept': '*/*',
        'Allow': 'application/json','Accept-Encoding': 'gzip, deflate, br'  },
    body: {
        mode: 'urlencoded',
        urlencoded: [
          { key:'grant_type', value:'password'}, { key:'client_id', value:'portal'},
          { key:'username', value:username}, {key:'password', value:password}] }
    }, function (err, response) {
    
    if (!err) {
      var jsonData = response.json();
      if (jsonData.error) {
        console.error(jsonData.error)
      } else {
        pm.environment.set('sandboxToken', jsonData.access_token)
        console.log("New access token fetched for: " + username)
        console.log(getTokenClaims(pm.environment.get('sandboxToken')))
        return jsonData.access_token
      }
    } else {
      console.error(err)
    }
  });
}
module.exports = {addAuthTokenString}