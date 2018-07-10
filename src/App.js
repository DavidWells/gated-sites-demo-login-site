import React, { Component } from 'react'
import netlifyIdentity from 'netlify-identity-widget'
import logo from './logo.svg'
import './App.css'

window.netlifyIdentity = netlifyIdentity

const REDIRECT_URL = 'redirect_url'
const sites = [
  {
    url: 'https://gated-sites-demo-site1.netlify.com',
    title: 'Site 1'
  },
  {
    url: 'https://gated-sites-demo-site2.netlify.com',
    title: 'Site 2'
  }
]

export default class App extends Component {
  constructor() {
    super()
    console.log('document.referrer', document.referrer)
    const parsed = getParams()
    // Set redirect URL
    if (parsed.site) {
      localStorage.setItem(REDIRECT_URL, parsed.site)
    }
    const redirectUrl = localStorage.getItem(REDIRECT_URL)
    // start identity
    netlifyIdentity.on("init", user => {
      if (user && redirectUrl) {
        console.log('user', user)
        // doRedirect(redirectUrl, user.token.access_token)
      }
    })
    netlifyIdentity.init()
  }
  componentDidMount() {
    /* Register listeners on identity widget events */
    netlifyIdentity.on("login", (user) => {
      /* Close netlify identity modal on login */
      netlifyIdentity.close()
      console.log('login complete', user)
      // refresh page
      const redirectUrl = localStorage.getItem(REDIRECT_URL) || sites[0].url
      console.log('Redirect', redirectUrl)
      doRedirect(redirectUrl, user.token.access_token)
    })
    netlifyIdentity.on("logout", () => {
      // reload page
      window.location.href = window.location.href
    })
  }
  handleLogIn = () => {
    // Open login
    netlifyIdentity.open()
  }
  handleLogOut = () => {
    netlifyIdentity.logout()
  }
  renderButton() {
    const user = netlifyIdentity.currentUser()
    if (!user) {
      return (
        <button onClick={this.handleLogIn}>
          Sign up or Log in
        </button>
      )
    }
    return (
      <button onClick={this.handleLogOut}>
        Log out {user.email}
      </button>
    )
  }
  renderSiteList() {
    return sites.map((site) => {
      return (
        <div className='site-wrapper'>
          <div className='site-url'>
            <h2>
              <a href={site.url}>
                Click to visit "{site.title}"
              </a>
            </h2>
          </div>
          <div className='site-contents'>
            <div className='site-cookies'>
              <button onClick={() => { window.location.href = `${site.url}/cookies/` }}>
                View {site.title} cookies 🍪
              </button>
            </div>
            <div className='site-clear-auth'>
              <button onClick={() => { removeCookie(site.url) }}>
                ❌ {site.title} clear auth cookie
              </button>
            </div>
          </div>
        </div>
      )
    })
  }
  render() {



    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">
            Login "Portal" Site
          </h1>
          <p>Login to access a site</p>
          <div>
           {this.renderButton()}
          </div>
        </header>

        <div>
          <h2>Protected Site List</h2>
          {this.renderSiteList()}
        </div>
      </div>
    )
  }
}

function doRedirect(url, token) {
  window.location.href = `/.netlify/functions/handle-login-get?url=${url}&token=${token}`
}

function removeCookie(url) {
  netlifyIdentity.logout()
  window.location.href = `${url}/.netlify/functions/delete-cookie`
}

function setCookie(url, token) {
  window.location.href = `${url}/.netlify/functions/delete-cookie`
}

/* Not in use
function doLogin(redirectUrl) {
  return generateHeaders().then((headers) => {
    return fetch('/.netlify/functions/handle-login-post', {
      method: "POST",
      headers,
      body: JSON.stringify({
        url: redirectUrl
      })
    })
    .then(response => {
      if (!response.ok) {
        return response.text().then(err => { throw(err) })
      }
      return response.json()
    })
    .catch((err) => {
      console.log('err', err)
    })
  })
}

function generateHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (netlifyIdentity.currentUser()) {
    return netlifyIdentity.currentUser().jwt().then((token) => {
      return { ...headers, Authorization: `Bearer ${token}` };
    })
  }
  return Promise.resolve(headers);
} */

function getParams(url) {
  const urlParams = {}
  const pattern = /([^&=]+)=?([^&]*)/g
  let params
  let matches
  if (url) {
    const p = url.match(/\?(.*)/) // query
    params = (p && p[1]) ? p[1].split('#')[0] : ''
  } else {
    params = window.location.search.substring(1)
  }
  if (!params) return false
  while (matches = pattern.exec(params)) {
    if (matches[1].indexOf('[') == '-1') {
      urlParams[decode(matches[1])] = decode(matches[2])
    } else {
      const b1 = matches[1].indexOf('[')
      const aN = matches[1].slice(b1 + 1, matches[1].indexOf(']', b1))
      const pN = decode(matches[1].slice(0, b1))

      if (typeof urlParams[pN] !== 'object') {
        urlParams[decode(pN)] = {}
        urlParams[decode(pN)].length = 0
      }

      if (aN) {
        urlParams[decode(pN)][decode(aN)] = decode(matches[2])
      } else {
        Array.prototype.push.call(urlParams[decode(pN)], decode(matches[2]))
      }
    }
  }
  return urlParams
}

function decode(s) {
  return decodeURIComponent(s).replace(/\+/g, ' ')
}
