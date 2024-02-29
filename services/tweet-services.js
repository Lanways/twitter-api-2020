const { Tweet, Reply, Like, User } = require('../models')
const helpers = require('../_helpers')

const tweetServices = {
  getTweets: (req, cb) => {
    return Tweet.findAll({
      include: [
        { model: User, attributes: ['id', 'name', 'account', 'avatar'] },
        { model: Like, attributes: ['id', 'UserId'] },
        { model: Reply, attributes: ['id'] }
      ],
      order: [['createdAt', 'DESC']]
    })
      .then(ts => {
        if (!ts) throw new Error('Tweets is not exist')
        const tweetData = ts.map(tweet => {
          const tweetMapData = tweet.toJSON()
          return {
            ...tweetMapData,
            RepliesCount: tweet.Replies.length,
            LikesCount: tweet.Likes.length,
            isLiked: tweet.Likes.some(like => like.UserId === helpers.getUser(req).id)
          }
        })
        cb(null, (tweetData))
      })
      .catch(err => {
        cb(err)
      })
  },
  getPostTweet: (req, cb) => {
    User.findOne({ where: { id: helpers.getUser(req).id } })
      .then(user => {
        if (!user) throw new Error('Not logged in')
        const userAvatar = user.avatar
        cb(null, userAvatar)
      })
      .catch(err => {
        cb(err)
      })
  },
  postTweet: (req, description, cb) => {
    return Tweet.create({
      description: description,
      UserId: helpers.getUser(req).id
    })
      .then(tweet => {
        cb(null, tweet)
      })
      .catch(err => {
        cb(err)
      })
  },
  getReplies: (req, cb) => {
    const tweetId = req.params.tweet_id
    return Tweet.findByPk(tweetId, {
      include:
        [{ model: Reply, include: [{ model: User }] }]
    })
      .then(tweet => {
        if (!tweet) throw new Error('Tweet is no exist')
        cb(null, tweet.Replies)
      })
      .catch(err => {
        cb(err)
      })
  },
  postReply: (req, res) => {
    const UserId = helpers.getUser(req).id
    const TweetId = req.params.tweet_id
    const { comment } = req.body
    new Promise((resolve, reject) => {
      if (Number(req.body.comment.length) < 1) reject(new Error('Content cannot be blank.'))
      resolve()
    })
      .then(() => {
        return Promise.all([
          Tweet.findByPk(TweetId),
          User.findByPk(UserId)
        ])
      })
      .then(([tweet, user]) => {
        if (!tweet) throw new Error('The tweet does not exist.')
        if (!user) throw new Error(`Please log in again.`)
        return Reply.create({
          comment,
          UserId,
          TweetId
        })
      })
      .then(reply => res.status(200).json(reply))
      .catch(err => res.status(500).json({ status: 'err', error: err.message }))
  },
}

module.exports = tweetServices
