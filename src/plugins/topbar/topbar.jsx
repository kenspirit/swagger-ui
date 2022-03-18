import React, { cloneElement } from "react"
import PropTypes from "prop-types"

//import "./topbar.less"
import Logo from "./logo_small.svg"
import {parseSearch, serializeSearch} from "../../core/utils"

export default class Topbar extends React.Component {

  static propTypes = {
    layoutActions: PropTypes.object.isRequired,
    authActions: PropTypes.object.isRequired
  }

  constructor(props, context) {
    super(props, context)
    this.state = { url: props.specSelectors.url(), lang: props.specSelectors.lang(), selectedIndex: 0, selectedLangIndex: 0 }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({ url: nextProps.specSelectors.url(), lang: nextProps.specSelectors.lang() })
  }

  onUrlChange =(e)=> {
    let {target: {value}} = e

    this.setState({ url: value })
  }

  flushAuthData() {
    const { persistAuthorization } = this.props.getConfigs()
    if (persistAuthorization)
    {
      return
    }
    this.props.authActions.restoreAuthorization({
      authorized: {}
    })
  }

  loadSpec = (url, lang) => {
    this.flushAuthData()
    this.props.specActions.updateUrl(url)
    if (lang) {
      this.props.specActions.updateLang(lang)
    }
    this.props.specActions.download(url)
  }

  onUrlSelect =(e)=> {
    let url = e.target.value || e.target.href
    this.loadSpec(url, this.state.lang)
    this.setSelectedUrl(url)
    e.preventDefault()
  }

  onLangSelect = (e) => {
    let lang = e.target.value || e.target.href
    this.setSelectedLang(lang)
    this.loadSpec(this.state.url, lang)
    e.preventDefault()
  }

  downloadUrl = (e) => {
    this.loadSpec(this.state.url, this.state.lang)
    e.preventDefault()
  }

  setSearch = (spec) => {
    let search = parseSearch()
    search["urls.primaryName"] = spec.name
    const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`
    if(window && window.history && window.history.pushState) {
      window.history.replaceState(null, "", `${newUrl}?${serializeSearch(search)}`)
    }
  }

  setSelectedUrl = (selectedUrl) => {
    const configs = this.props.getConfigs()
    const urls = configs.urls || []

    if(urls && urls.length) {
      if(selectedUrl)
      {
        urls.forEach((spec, i) => {
          if(spec.url === selectedUrl)
            {
              this.setState({selectedIndex: i})
              this.setSearch(spec)
            }
        })
      }
    }
  }

  setSelectedLang = (selectedLang) => {
    const configs = this.props.getConfigs()
    const langs = configs.langs || []

    if (langs && langs.length && selectedLang) {
      langs.forEach((lang, i) => {
        if (lang.code === selectedLang) {
          this.setState({ selectedLangIndex: i })
        }
      })
    }
  }

  componentDidMount() {
    const configs = this.props.getConfigs()
    const urls = configs.urls || []
    const langs = configs.langs || []

    if (langs && langs.length) {
      this.setSelectedLang(configs.lang)
    }

    if(urls && urls.length) {
      var targetIndex = this.state.selectedIndex
      let primaryName = configs["urls.primaryName"]
      if(primaryName)
      {
        urls.forEach((spec, i) => {
          if(spec.name === primaryName)
            {
              this.setState({selectedIndex: i})
              targetIndex = i
            }
        })
      }

      this.loadSpec(urls[targetIndex].url, configs.lang)
    }
  }

  onFilterChange =(e) => {
    let {target: {value}} = e
    this.props.layoutActions.updateFilter(value)
  }

  render() {
    let { getComponent, specSelectors, getConfigs } = this.props
    const Button = getComponent("Button")
    const Link = getComponent("Link")

    let isLoading = specSelectors.loadingStatus() === "loading"
    let isFailed = specSelectors.loadingStatus() === "failed"

    const classNames = ["download-url-input"]
    if (isFailed) classNames.push("failed")
    if (isLoading) classNames.push("loading")

    const { urls, langs } = getConfigs()
    let control = []
    let formOnSubmit = null

    if (langs) {
      let rows = []
      langs.forEach((lang, i) => {
        rows.push(<option key={i} value={lang.code}>{lang.name}</option>)
      })

      control.push(
        <label className="select-label" htmlFor="select"><span>Select a language</span>
          <select id="select" disabled={isLoading} onChange={this.onLangSelect} value={langs[this.state.selectedLangIndex].code}>
            {rows}
          </select>
        </label>
      )
    }
    if(urls) {
      let rows = []
      urls.forEach((link, i) => {
        rows.push(<option key={i} value={link.url}>{link.name}</option>)
      })

      control.push(
        <label className="select-label" htmlFor="select"><span>Select a definition</span>
          <select id="select" disabled={isLoading} onChange={ this.onUrlSelect } value={urls[this.state.selectedIndex].url}>
            {rows}
          </select>
        </label>
      )
    }
    else {
      formOnSubmit = this.downloadUrl
      control.push(<input className={classNames.join(" ")} type="text" onChange={ this.onUrlChange } value={this.state.url} disabled={isLoading} />)
      control.push(<Button className="download-url-button" onClick={ this.downloadUrl }>Explore</Button>)
    }

    return (
      <div className="topbar">
        <div className="wrapper">
          <div className="topbar-wrapper">
            <Link>
              <img height="40" src={ Logo } alt="Swagger UI"/>
            </Link>
            <form className="download-url-wrapper" onSubmit={formOnSubmit}>
              {control.map((el, i) => cloneElement(el, { key: i }))}
            </form>
          </div>
        </div>
      </div>
    )
  }
}

Topbar.propTypes = {
  specSelectors: PropTypes.object.isRequired,
  specActions: PropTypes.object.isRequired,
  getComponent: PropTypes.func.isRequired,
  getConfigs: PropTypes.func.isRequired
}
