import React, { Component } from 'react'
const { func, object } = React.PropTypes
import { compose } from 'redux'
import { connect } from 'react-redux'
import { prefetch } from 'react-fetcher'
import {
  COMMUNITY_SETUP_CHECKLIST,
  REQUEST_TO_JOIN_COMMUNITY,
  IN_FEED_PROFILE_COMPLETION_MODULES,
  IN_FEED_ENGAGEMENT_MODULES
} from '../../config/featureFlags'
import {
  isMember, canModerate, hasFeature, hasBio, hasSkills
} from '../../models/currentUser'
import {
  navigate,
  requestToJoinCommunity,
  showModal,
  sendGraphqlQuery,
  updateCommunityChecklist
} from '../../actions'
import { getChecklist, checklistPercentage } from '../../models/community'
import { coinToss } from '../../util'
import { fetch, ConnectedPostList } from '../ConnectedPostList'
import PostEditor from '../../components/PostEditor'
import ProfileSkillsModule from '../../components/ProfileSkillsModule'
import ProfileBioModule from '../../components/ProfileBioModule'
import PopularSkillsModule from '../../components/PopularSkillsModule'
import PostPromptModule from '../../components/PostPromptModule'
import { PercentBar } from '../ChecklistModal'

const subject = 'community'
export const MIN_MEMBERS_FOR_SKILLS_MODULE = 6
export const MIN_POSTS_FOR_POST_PROMPT_MODULE = 4

const getFeedModule = (community, currentUser, moduleChoice) => {
  let module

  const showPopularSkills = community.memberCount >= MIN_MEMBERS_FOR_SKILLS_MODULE
  const showPostPrompt = community.postCount >= MIN_POSTS_FOR_POST_PROMPT_MODULE

  module = {
    id: -1,
    type: 'module'
  }

  if (showPopularSkills && showPostPrompt) {
    module.component = moduleChoice
    ? <PopularSkillsModule community={community} />
    : <PostPromptModule />
  } else if (showPopularSkills) {
    module.component = <PopularSkillsModule community={community} />
  } else if (showPostPrompt) {
    module.component = <PostPromptModule />
  } else {
    module = null
  }

  return module
}

export class CommunityPosts extends Component {
  static propTypes = {
    dispatch: func,
    params: object,
    community: object,
    location: object
  }
  static contextTypes = {currentUser: object}
  static childContextTypes = {community: object}

  getChildContext () {
    let { community } = this.props
    return {community}
  }

  constructor (props) {
    super(props)
    this.state = {
      optimisticSent: false,
      joinRequestError: false,
      module: null
    }
  }

  requestToJoin (opts) {
    const { community, dispatch } = this.props
    const { currentUser } = this.context
    if (!currentUser) return dispatch(navigate(`/signup?next=/c/${community.slug}?join=true`))
    this.setState({optimisticSent: true})
    return dispatch(requestToJoinCommunity(community.slug))
    .then(({ error }) => error
      ? this.setState({joinRequestError: true})
      : null)
  }

  componentDidMount () {
    let { location: { query }, dispatch, community } = this.props
    const { currentUser } = this.context
    let { checklist, join } = query || {}
    if (checklist && hasFeature(currentUser, COMMUNITY_SETUP_CHECKLIST) &&
      checklistPercentage(getChecklist(community)) !== 100) {
      dispatch(showModal('checklist'))
    }
    if (join && hasFeature(currentUser, REQUEST_TO_JOIN_COMMUNITY) &&
      !isMember(currentUser, community)) {
      this.requestToJoin({maxage: false})
    }
    if (hasFeature(currentUser, IN_FEED_ENGAGEMENT_MODULES)) {
      this.setState({moduleChoice: coinToss()})
    }
  }

  render () {
    let { location: { query }, dispatch, community, params: { id } } = this.props
    const { currentUser } = this.context
    const { optimisticSent, joinRequestError, moduleChoice } = this.state
    const module = typeof moduleChoice !== 'undefined'
      ? getFeedModule(community, currentUser, moduleChoice)
      : null

    return <div>
      {hasFeature(currentUser, COMMUNITY_SETUP_CHECKLIST) && canModerate(currentUser, community) &&
        <CommunitySetup community={community} actions={{
          showModal: () => dispatch(showModal('checklist')),
          update: () => dispatch(updateCommunityChecklist(community.slug))
        }} />}
      {hasFeature(currentUser, IN_FEED_PROFILE_COMPLETION_MODULES) && isMember(currentUser, community) &&
        <ProfileCompletionModules person={currentUser} />}
      {isMember(currentUser, community) && <PostEditor community={community} />}
      {hasFeature(currentUser, REQUEST_TO_JOIN_COMMUNITY) && !isMember(currentUser, community) &&
        <div className='request-to-join'>
          {!optimisticSent && !joinRequestError && <span>
            You are not a member of this community. <a onClick={() => this.requestToJoin()} className='button'>Request to Join</a>
          </span>}
          {optimisticSent && !joinRequestError && <span>
            Your request to join has been sent to the community moderators.
          </span>}
          {joinRequestError && <span>
            There was an error creating your join request. Please try again later.
          </span>}
        </div>}
      <ConnectedPostList {...{subject, id, query}} module={module} showProjectActivity />
      {!isMember(currentUser, community) && <div className='post-list-footer'>
        You are not a member of this community, so you are shown only posts that are marked as public.
      </div>}
    </div>
  }
}

const fetchCommunityStats = slug =>
  sendGraphqlQuery(`query ($slug: String) {
    community(slug: $slug) {
      memberCount
      postCount
    }
  }`, {
    subject: 'community-stats',
    id: slug,
    variables: {slug}
  })

class CommunitySetup extends React.Component {
  componentDidMount () {
    this.props.actions.update()
  }

  render () {
    const { community, actions } = this.props
    const checklist = getChecklist(community)
    const percent = checklistPercentage(checklist)
    if (percent === 100) return null
    return <div className='community-setup'
      onClick={actions.showModal}>
      <PercentBar percent={percent} />
      Your community is {percent}% set up. <a>Click here</a> to continue setting it up.
    </div>
  }
}

const ProfileCompletionModules = ({ person }) => {
  if (!hasBio(person)) {
    return <ProfileBioModule person={person} />
  } else if (!hasSkills(person)) {
    return <ProfileSkillsModule person={person} />
  } else {
    return null
  }
}

// Redux connection

export function serverFetchToState ({ dispatch, params: { id }, query }) {
  return Promise.all([
    dispatch(fetch(subject, id, query)),
    dispatch(fetchCommunityStats(id))
  ])
}

export function mapStateToProps (state, { params }) {
  return {
    community: state.communities[params.id],
    currentUser: state.people.current
  }
}

export default compose(
  prefetch(serverFetchToState),
  connect(mapStateToProps)
)(CommunityPosts)
