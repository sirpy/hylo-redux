import React, { Component } from 'react'
const { func, object } = React.PropTypes
// Redux connection related
import { compose } from 'redux'
import { connect } from 'react-redux'
import { prefetch } from 'react-fetcher'
// Component related
import {
  COMMUNITY_SETUP_CHECKLIST,
  REQUEST_TO_JOIN_COMMUNITY,
  IN_FEED_PROFILE_COMPLETION_MODULES
} from '../../config/featureFlags'
import { fetch, ConnectedPostList } from '../ConnectedPostList'

import PostEditor from '../../components/PostEditor'
import ProfileSkillsModule from '../../components/ProfileSkillsModule'
import ProfileBioModule from '../../components/ProfileBioModule'
import PopularSkillsModule from '../../components/PopularSkillsModule'
import PostPromptModule from '../../components/PostPromptModule'

import { PercentBar } from '../ChecklistModal'
import {
  isMember, canModerate, hasFeature, hasBio, hasSkills
} from '../../models/currentUser'
import { navigate, notify, showModal } from '../../actions'
import { sendGraphqlQuery } from '../../actions/graphql'
import { requestToJoinCommunity } from '../../actions/communities'
import { getChecklist, checklistPercentage } from '../../models/community'
import { groupUser } from 'hylo-utils'
import { coinToss } from '../../util'

const subject = 'community'
export const MIN_MEMBERS_FOR_SKILLS_MODULE = 6
export const MIN_POSTS_FOR_POST_PROMPT_MODULE = 4

const getFeedModule = (community, currentUser, moduleChoice) => {
  let module

  if (groupUser(currentUser.id, 'In-Feed Engagement Modules') === 0) {
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
      moduleChoice: coinToss()
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
  }

  render () {
    let { location: { query }, dispatch, community, params: { id } } = this.props
    const { currentUser } = this.context
    const { optimisticSent, joinRequestError } = this.state

    const module = getFeedModule(community, currentUser, this.state.moduleChoice)

    return <div>
      {hasFeature(currentUser, COMMUNITY_SETUP_CHECKLIST) && canModerate(currentUser, community) &&
        <CommunitySetup community={community} dispatch={dispatch} />}
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
      <ConnectedPostList {...{subject, id, query}} module={module} />
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

const CommunitySetup = ({ community, dispatch }) => {
  const checklist = getChecklist(community)
  const percent = checklistPercentage(checklist)
  if (percent === 100) return null
  return <div className='community-setup'
    onClick={() => dispatch(showModal('checklist'))}>
    <PercentBar percent={percent} />
    Your community is {percent}% set up. <a>Click here</a> to continue setting it up.
  </div>
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

const mapStateToProps = (state, { params }) => ({
  community: state.communities[params.id],
  currentUser: state.people.current
})

export default compose(
  prefetch(({ dispatch, params: { id }, query }) =>
    Promise.all([
      dispatch(fetch(subject, id, query)),
      dispatch(fetchCommunityStats(id))
    ])),
  connect(mapStateToProps)
)(CommunityPosts)
