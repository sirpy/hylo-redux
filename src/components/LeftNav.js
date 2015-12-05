import { A } from './A'
import React from 'react'
import cx from 'classnames'

const LeftNav = props => {
  let { open } = props
  return <nav id='leftNav' className={cx({open})}>
    <ul>
      <A to='/all-posts'>All posts</A>
      <A to='/my-posts'>My posts</A>
      <A to='/followed-posts'>Followed posts</A>
      <A to='/projects'>Projects</A>
      {props.communities.map((c, i) => <li key={i}>
        <A to={`/c/${c.slug}`}>
          <img src={c.avatar_url}/>
          {c.name}
        </A>
      </li>)}
    </ul>
  </nav>
}

export default LeftNav
