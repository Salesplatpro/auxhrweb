import { Pagination, Stack } from '@mui/material'
import React from 'react'

import ResourceImage from '@/assets/resource.png'

import styles from './Resources.module.scss'

export const Resources = () => {
  const resourcePost = {
    title: 'How to boost sales',
    image: ResourceImage,
    description:
      'Elit nisi in eleifend sed nisi. Pulvinar at orci, proin imperdiet commodo consectetur convallis risus. Sed condimentum enim dignissim adipiscing faucibus consequat, ',
    action: 'Read More',
  }

  const resourcePosts = Array.from({ length: 12 }, () => ({ ...resourcePost }))

  return (
    <>
      <div className="solution-header">
        <div className="content">
          <div className="main-texts">
            <h3 data-testId="heading">Business Resources</h3>
          </div>
          <p className="supporting-text">
            Streamline Your Hiring Process and Make Confident Decisions with
            Auxhr&apos;s comprehensive platform. Check back at intervals for
            more resources
          </p>
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.title}>Business Resources</div>
        <p className={styles.lede}>
          Build your tech stack with confidence and guidance, selecting from our
          resources
        </p>

        <div className={styles.grid}>
          {resourcePosts.map((item, index) => (
            <div key={index} className={styles.post}>
              <img src={item.image} alt="Resource" className={styles.image} />
              <div className={styles.postTitle}>{item.title}</div>
              <div className={styles.postBody}>{item.description}</div>
              <div className={styles.postAction}>{item.action}</div>
            </div>
          ))}
        </div>
      </div>
      <Stack>
        <Pagination
          count={10}
          shape="rounded"
          color="primary"
          className={styles.pager}
        />
      </Stack>
    </>
  )
}
