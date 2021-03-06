import React from 'react'
import A, { IndexA } from './A'
import { connect } from 'react-redux'
import Icon from './Icon'
import NavMenuButton from './NavMenuButton'
import Tooltip from './Tooltip'
import { VelocityTransitionGroup } from 'velocity-react'
import { isEmpty } from 'lodash'
import { filter, sortBy } from 'lodash/fp'
import { tagUrl } from '../routes'
import { showAllTags } from '../actions'
import cx from 'classnames'
const { bool } = React.PropTypes

export const leftNavEasing = [70, 25]
// these values are duplicated in CSS
export const leftNavWidth = 208
export const menuButtonWidth = 87

const animations = {
  enter: {
    animation: {translateX: [0, '-100%']},
    easing: leftNavEasing
  },
  leave: {
    animation: {translateX: '-100%'},
    easing: leftNavEasing
  }
}

const TopicList = ({ tags, community, showMore }) => {
  const followed = sortBy(t => {
    switch (t.name) {
      case 'offer': return 'a'
      case 'request': return 'b'
      case 'intention': return 'c'
      default:
        if (t.is_default) return 'd' + t.name.toLowerCase()
        return 'e' + t.name.toLowerCase()
    }
  }, filter('followed', tags))

  const { slug } = community || {}

  const TagLink = ({ name, highlight }) => {
    var allTopics = name === 'all-topics'
    var AComponent = allTopics ? IndexA : A
    return <li>
      <AComponent to={tagUrl(name, slug)} className={cx({highlight})}>
        <span className='bullet'>•</span>&nbsp;&nbsp;# {name}
      </AComponent>
    </li>
  }

  return <ul className='topic-list'>
    <li className='subheading'>
      <a>FOLLOWING ({followed.length + 1})</a>
    </li>
    <TagLink name='all-topics' />
    {!isEmpty(followed) && followed.map(tag =>
      <TagLink name={tag.name} key={tag.name} highlight={tag.new_post_count} />)}
    {slug && <li>
      <a onClick={showMore} className='browse-all'>
        Follow more topics...
      </a>
    </li>}
  </ul>
}

const CommunityNav = ({ links }) => {
  const LinkItem = ({ link }) => {
    const { url, icon, label, index } = link
    const AComponent = index ? IndexA : A
    return <AComponent to={url}><Icon name={icon} />{label}</AComponent>
  }

  return <ul className='nav-links community-nav-links'>
    {links.map(link => <LinkItem link={link} key={link.label} />)}
  </ul>
}

const NetworkNav = ({ network }) => {
  const { slug } = network
  const url = suffix => `/n/${slug}/${suffix}`

  return <ul className='nav-links network-nav-links'>
    <li>
      <IndexA to={`/n/${slug}`}>
        <Icon name='Comment-Alt' /> Conversations
      </IndexA>
    </li>
    <li>
      <A to={url('communities')}><Icon name='Keypad' /> Communities</A>
    </li>
    <li>
      <A to={url('members')}><Icon name='Users' /> Members</A>
    </li>
    <li>
      <A to={url('about')}><Icon name='Help' /> About</A>
    </li>
  </ul>
}

export function LeftNav ({ opened, community, network, tags, close, links, actions }, { isMobile }) {
  const onMenuClick = event => {
    close()
    event.stopPropagation()
  }

  return <span>
    <VelocityTransitionGroup {...animations}>
      {opened && <nav id='leftNav' onClick={() => isMobile && close()}>
        <NavMenuButton onClick={onMenuClick} label={isMobile ? 'Menu' : 'Topics'} showClose />
        {network
          ? <NetworkNav network={network} />
          : <CommunityNav links={links} />}
        <TopicList tags={tags} community={community} showMore={actions.showAllTags} />
      </nav>}
      {opened && <div id='leftNavBackdrop' onClick={close} />}
    </VelocityTransitionGroup>
    {opened && <Tooltip id='topics'
      index={2}
      position='right'
      title='Topics'>
      <p>The Topics you follow or create will be listed here for easy access and to display notifications on new activity in that Topic.</p>
      <p>Clicking a Topic shows you just the Conversations under that Topic.</p>
    </Tooltip>}
  </span>
}
LeftNav.contextTypes = {isMobile: bool}

export default connect(null, (dispatch, { community }) => ({
  actions: {
    showAllTags: () => dispatch(showAllTags(community))
  }
}))(LeftNav)
