const express = require('express');
const mongoose = require('mongoose');
const Dishes = require('../models/dishes');
//const common = require("./common");
const authenticate = require('../authenticate');

const dishRouter = express.Router();

dishRouter.use(express.urlencoded({extended: true}));
dishRouter.use(express.json());

//common (partially supported common module)
var not_supported = (res, msg) => {
    res.statusCode = 403;
    res.end(msg);
}

var success_response = (res, content) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(content);
}

var missing_record = (recordType, recordId) => {
    err = new Error(recordType + " " + recordId + " not found");
    err.status = 404;
    return next(err);
}

dishRouter.route('/')
.get((req, res, next) => {
    Dishes.find({})
        .populate('comments.author')
        .then((dishes) => success_response(res, dishes), (err) => next(err))
        .catch((err) => next(err));
}).post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Dishes.create(req.body)
        .then((dish) => success_response(res, dish), (err) => next(err))
        .catch((err) => next(err));
}).put(authenticate.verifyUser,  authenticate.verifyAdmin, (_, res, next) => {
    not_supported(res, 'PUT operation not supported on /dishes')
}).delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Dishes.remove({})
        .then((resp) => success_response(res, resp), (err) => next(err))
        .catch((err) => next(err));
});

dishRouter.route('/:dishId')
.get((req, res, next) => {
    Dishes.findById(req.params.dishId)
        .populate('comments.author')
        .then((dish) => success_response(res, dish), (err) => next(err))
        .catch((err) => next(err));
}).post(authenticate.verifyUser,  authenticate.verifyAdmin, (req, res, next) => {
    not_supported(res, 'POST operation not supported on /dishes/'+ req.params.dishId)
}).put(authenticate.verifyUser,  authenticate.verifyAdmin, (req, res, next) => {
    Dishes.findByIdAndUpdate(req.params.dishId, {$set: req.body}, { new: true })
        .then((dish) => success_response(res, dish), (err) => next(err))
        .catch((err) => next(err));
}).delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Dishes.findByIdAndRemove(req.params.dishId)
        .then((dish) => success_response(res, dish), (err) => next(err))
        .catch((err) => next(err));
});



dishRouter.route('/:dishId/comments')
.get((req, res, next) => {
    Dishes.findById(req.params.dishId)
        .populate('comments.author')
        .then((dish) => {
            if (null != dish) {
                success_response(res, dish.comments);
            } else {
                return missing_record("Dish", req.params.dishId);
            }
        } , (err) => next(err))
        .catch((err) => next(err));
}).post(authenticate.verifyUser, (req, res, next) => {
    Dishes.findById(req.params.dishId)
        .then((dish) => {
            if (null != dish) {
                req.body.author = req.user._id;
                dish.comments.push(req.body);
                dish.save().then((dish) => {
                    Dishes.findById(dish._id)
                        .populate('comments.author')
                        .then((dish) => {
                            success_response(res, dish);
                        });
                })
            } else {
                return missing_record("Dish", req.params.dishId);
            }
        } , (err) => next(err))
        .catch((err) => next(err));
}).put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    not_supported(res, 'PUT operation not supported on /dishes/' + req.params.dishId + "/comments")
}).delete(authenticate.verifyUser, (req, res, next) => {
    Dishes.findById(req.params.dishId)
        .then((dish) => {
            if (null != dish) {
                for (var i = (dish.comments.length-1); i >= 0; i--) {
                    if(req.user._id.equals(dish.comments[i].author)) {
                        dish.comments.id(dish.comments[i]._id).remove();
                    }
                }
                dish.save().then((dish) => {
                    success_response(res, dish);
                }, (err) => next(err));
            } else {
                return missing_record("Dish", req.params.dishId);
            }
        } , (err) => next(err))
        .catch((err) => next(err));
});

dishRouter.route('/:dishId/comments/:commentId')
.get((req, res, next) => {
    Dishes.findById(req.params.dishId)
        .populate('comments.author')
        .then((dish) => {
            if (null != dish && null != dish.comments.id(req.params.commentId)) {
                success_response(res, dish.comments.id(req.params.commentId));
            } else if (null == dish) {
                return missing_record("Dish", req.params.dishId);
            } else {
                return missing_record("Comment", req.params.commentId);
            }
        } , (err) => next(err))
        .catch((err) => next(err));
}).post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    not_supported(res, 'POST operation not supported on /dishes/'+ req.params.dishId + "/comments/" + req.params.commentId);
}).put(authenticate.verifyUser, (req, res, next) => {
    Dishes.findById(req.params.dishId)
        .then((dish) => {
            
            if (null != dish && null != dish.comments.id(req.params.commentId)) {

                var targetComment = dish.comments.id(req.params.commentId);

                if(!req.user._id.equals(targetComment.author)) {
                    return not_supported(res, 'You are not authorized to update this comment!');
                }

                if (req.body.rating) 
                    targetComment.rating = req.body.rating;
                if (req.body.comment) 
                    targetComment.comment = req.body.comment;

                dish.save().then((dish) => {
                    Dishes.findById(dish._id)
                    .populate('comments.author')
                    .then((dish) => {
                        success_response(res, dish);
                    })
                }, (err) => next(err));
            } else if (null == dish) {
                return missing_record("Dish", req.params.dishId);
            } else {
                return missing_record("Comment", req.params.commentId);
            }
        } , (err) => next(err))
        .catch((err) => next(err));
}).delete(authenticate.verifyUser, (req, res, next) => {
    Dishes.findById(req.params.dishId)
        .then((dish) => {
            if (null != dish && null != dish.comments.id(req.params.commentId)) {

                if(!req.user._id.equals(dish.comments.id(req.params.commentId).author)) {
                    return not_supported(res, 'You are not authorized to delete this comment!');
                }
                
                dish.comments.id(req.params.commentId).remove();
                dish.save().then((dish) => {
                    Dishes.findById(dish._id)
                    .populate('comments.author')
                    .then((dish) => {
                        success_response(res, dish);
                    })
                }, (err) => next(err));
            } else if (null == dish) {
                return missing_record("Dish", req.params.dishId);
            } else {
                return missing_record("Comment", req.params.commentId);
            }
        } , (err) => next(err))
        .catch((err) => next(err));
});

module.exports = dishRouter;