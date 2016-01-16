import React from 'react'
import { prefetch } from 'react-fetcher'
import { connect } from 'react-redux'
import { debounce } from 'lodash'
import { fetchPeople } from '../../actions/fetchPeople'
import { fetchWithCache, connectedListProps, refetch } from '../../util/caching'
import ScrollListener from '../../components/ScrollListener'
import PersonCards from '../../components/PersonCards'
import { debug } from '../../util/logging'
const { array, bool, func, number, object } = React.PropTypes

const subject = 'community'
const fetch = fetchWithCache(fetchPeople)

@prefetch(({ dispatch, params: { id }, query }) => dispatch(fetch(subject, id, query)))
@connect((state, { params: { id }, location: { query } }) => {
  return connectedListProps(state, {subject, id, query}, 'people')
})
export default class CommunityMembers extends React.Component {
  static propTypes = {
    people: array,
    pending: bool,
    dispatch: func,
    total: number,
    params: object,
    location: object
  }

  loadMore = () => {
    let { people, dispatch, total, pending, params: { id }, location: { query } } = this.props
    let offset = people.length
    if (!pending && offset < total) {
      dispatch(fetch(subject, id, {...query, offset}))
    }
  }

  updateQuery = opts => {
    let { dispatch, location } = this.props
    dispatch(refetch(opts, location))
  }

  render () {
    let { pending, people, total, location: { query } } = this.props
    let { search } = query
    debug(`people: ${people.length || 0} / ${total || '??'}`)

    return <div className='members'>
      <input type='text' className='form-control search'
        placeholder='Search'
        defaultValue={search}
        onChange={debounce(event => this.updateQuery({search: event.target.value}), 500)}/>
      {pending && <div className='loading'>Loading...</div>}
      <PersonCards people={people}/>
      <ScrollListener onBottom={this.loadMore}/>
    </div>
  }
}
