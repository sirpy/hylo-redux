import { match } from 'react-router'
import { getPrefetchedData, getDeferredData } from 'react-fetcher'
import { debug } from '../util/logging'
import { isEqual } from 'lodash'
import { denormalizedCurrentUser } from '../models/currentUser'
import { localsForPrefetch } from '../util/universal'
import { identify } from '../util/analytics'
import { calliOSBridge } from './util'

var prevLocation = null

const updateLocation = opts => location => {
  const { store, routes, history } = opts

  match({routes, location}, (error, redirectLocation, props) => {
    if (redirectLocation) return history.replace(redirectLocation)
    if (error) return console.error(error)
    let sameLocation

    // WEIRD: when the logout action is dispatched, it triggers a history event
    // even though the location didn't change. i don't know why that happens,
    // but we work around it here by comparing the new location to the previous
    // one.
    if (prevLocation && location.pathname === prevLocation.pathname &&
      isEqual(location.search, prevLocation.search)) {
      sameLocation = true
    }

    const components = props.routes.map(r => r.component)
    const locals = localsForPrefetch(props, store)

    const loadData = () =>
      // don't prefetch for the first route after page load, because it's all
      // been loaded on the server already
      Promise.resolve(prevLocation && getPrefetchedData(components, locals))
      .then(() => getDeferredData(components, locals))
      .then(() => prevLocation = location)

    if (sameLocation) {
      debug('reloading data for current page')
      return loadData()
    }

    identify(denormalizedCurrentUser(store.getState()))
    window.analytics.page()
    calliOSBridge({type: 'navigated', pathname: location.pathname})
    loadData()
  })
}

export default updateLocation
