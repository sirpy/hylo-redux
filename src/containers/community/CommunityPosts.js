import React from 'react'
import { fetchPosts, FETCH_POSTS } from '../../actions'
import { prefetch } from 'react-fetcher'
import { connect } from 'react-redux'
import PostList from '../../components/PostList'
import PostEditor from '../../components/PostEditor'
import { debug } from '../../util/logging'
const { array, bool, func, number, object } = React.PropTypes

@prefetch(({dispatch, params: {slug}}) => {
  return dispatch(fetchPosts({subject: 'community', id: slug, limit: 20}))
})
@connect((state, props) => {
  let { slug } = props.params
  return {
    posts: state.postsByCommunity[slug],
    total: state.totalPostsByCommunity[slug],
    pending: state.pending[FETCH_POSTS],
    community: state.communities[slug]
  }
})
export default class CommunityPosts extends React.Component {
  static propTypes = {
    posts: array,
    total: number,
    dispatch: func,
    params: object,
    pending: bool,
    community: object
  }

  loadMore = () => {
    let { posts, dispatch, params, total, pending } = this.props
    if (posts.length >= total || pending) return

    dispatch(fetchPosts({
      subject: 'community',
      id: params.slug,
      offset: posts.length,
      limit: 20
    }))
  }

  render () {
    if (this.props.pending) {
      return <div className='loading'>Loading...</div>
    }

    let posts = this.props.posts || []
    debug(`${posts.length} posts`)
    return <div>
      <PostEditor community={this.props.community}/>
      <PostList posts={posts} loadMore={this.loadMore}/>
    </div>
  }
}