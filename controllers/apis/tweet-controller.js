const { Tweet, Reply, Like, User } = require('../../models')
const helpers = require('../../_helpers')
const tweetServices = require('../../services/tweet-services')

const tweetController = {
  getTweets: (req, res, next) => {
    tweetServices.getTweets(req, (err, data) => err ? next(err) : res.json(data))
  },
  getPostTweet: (req, res, next) => {
    tweetServices.getPostTweet(req, (err, data) => err ? next(err) : res.json(data))
  },
  postTweet: (req, res, next) => {
    const { description } = req.body
    if (Number(description.length) > 140) return res.status(400).json({ status: 'error', message: 'The character count cannot exceed 140.' })
    if (Number(description.length) < 1) return res.status(400).json({ status: 'error', message: 'Content cannot be blank.' })
    tweetServices.postTweet(req, description, (err, data) => err ? next(err) : res.json(data))
  },
  getReplies: (req, res, next) => {
    tweetServices.getReplies(req, (err, data) => err ? next(err) : res.json(data))
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
  getTweet: (req, res) => {
    const tweetId = req.params.tweet_id
    return Promise.all([
      Tweet.findByPk(tweetId, {
        include: [
          { model: User, attributes: { exclude: ['password'] } },
          { model: Like }
        ]
      }),
      Reply.count({ where: { TweetId: tweetId } }),
    ])
      .then(([tweet, replies]) => {
        if (!tweet) throw new Error('The tweet does not exist.')
        tweet = tweet.toJSON()
        tweet.tweetOwnerName = tweet.User.name
        tweet.tweetOwnerAccount = tweet.User.account
        tweet.tweetOwnerAvatar = tweet.User.avatar
        delete tweet.User
        tweet.tweetLikeCount = tweet.Likes.length
        tweet.tweetReplyCount = replies
        tweet.isLiked = tweet.Likes.some(like => like.UserId === helpers.getUser(req).id)
        delete tweet.Likes
        res.status(200).json(tweet)
      })
      .catch(err => {
        res.status(500).json({ status: 'err', error: err.message })
      })
  }
}

module.exports = tweetController
