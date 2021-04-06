const express = require('express');
const mongoose = require('mongoose');
const Dishes = require('../models/dishes');
const common = require("./common");

const dishRouter = express.Router();

dishRouter.use(express.urlencoded({extended: true}));
dishRouter.use(express.json());

//common
var not_supported = (res, msg) => {
    res.statusCode = 403;
    res.end(msg);
}

// var success_response = (res, content) => {
//     res.statusCode = 200;
//     res.setHeader('Content-Type', 'application/json');
//     res.json(content);
// }

var missing_record = (recordType, recordId) => {
    err = new Error(recordType + " " + recordId + " not found");
    err.status = 404;
    return next(err);
}

dishRouter.route('/')
.get((req, res, next) => {
    Dishes.find({})
        .then((dishes) => common.successResponse(res, dishes), (err) => next(err))
        .catch((err) => next(err));
}).post((req, res, next) => {
    Dishes.create(req.body)
        .then((dish) => common.successResponse(res, dish), (err) => next(err))
        .catch((err) => next(err));
}).put((req, res, next) => {
    not_supported(res, 'PUT operation not supported on /dishes')
}).delete((req, res, next) => {
    Dishes.remove({})
        .then((resp) => common.successResponse(res, resp), (err) => next(err))
        .catch((err) => next(err));
});

dishRouter.route('/:dishId')
.get((req, res, next) => {
    Dishes.findById(req.params.dishId)
        .then((dish) => common.successResponse(res, dish), (err) => next(err))
        .catch((err) => next(err));
}).post((req, res, next) => {
    not_supported(res, 'POST operation not supported on /dishes/'+ req.params.dishId)
}).put((req, res, next) => {
    Dishes.findByIdAndUpdate(req.params.dishId, {$set: req.body}, { new: true })
        .then((dish) => common.successResponse(res, dish), (err) => next(err))
        .catch((err) => next(err));
}).delete((req, res, next) => {
    Dishes.findByIdAndRemove(req.params.dishId)
        .then((dish) => common.successResponse(res, dish), (err) => next(err))
        .catch((err) => next(err));
});



dishRouter.route('/:dishId/comments')
.get((req, res, next) => {
    Dishes.findById(req.params.dishId)
        .then((dish) => {
            if (null != dish) {
                common.successResponse(res, dish.comments);
            } else {
                return missing_record("Dish", req.params.dishId);
            }
        } , (err) => next(err))
        .catch((err) => next(err));
}).post((req, res, next) => {
    Dishes.findById(req.params.dishId)
        .then((dish) => {
            if (null != dish) {
                dish.comments.push(req.body);
                dish.save().then((dish) => {
                    common.successResponse(res, dish);
                })
            } else {
                return missing_record("Dish", req.params.dishId);
            }
        } , (err) => next(err))
        .catch((err) => next(err));
}).put((req, res, next) => {
    not_supported(res, 'PUT operation not supported on /dishes/' + req.params.dishId + "/comments")
}).delete((req, res, next) => {
    Dishes.findById(req.params.dishId)
        .then((dish) => {
            if (null != dish) {
                for (var i = (dish.comments.length-1); i >= 0; i--) {
                    dish.comments.id(dish.comments[i]._id).remove();
                }
                dish.save().then((dish) => {
                    common.successResponse(res, dish);
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
        .then((dish) => {
            if (null != dish && null != dish.comments.id(req.params.commentId)) {
                common.successResponse(res, dish.comments.id(req.params.commentId));
            } else if (null == dish) {
                return missing_record("Dish", req.params.dishId);
            } else {
                return missing_record("Comment", req.params.commentId);
            }
        } , (err) => next(err))
        .catch((err) => next(err));
}).post((req, res, next) => {
    not_supported(res, 'POST operation not supported on /dishes/'+ req.params.dishId + "/comments/" + req.params.commentId);
}).put((req, res, next) => {
    Dishes.findById(req.params.dishId)
        .then((dish) => {
            if (null != dish && null != dish.comments.id(req.params.commentId)) {
                if (req.body.rating) {
                    dish.comments.id(req.params.commentId).rating = req.body.rating;
                }
                if (req.body.comment) {
                    dish.comments.id(req.params.commentId).comment = req.body.comment;
                }
                dish.save().then((dish) => {
                    common.successResponse(res, dish);
                }, (err) => next(err));
            } else if (null == dish) {
                return missing_record("Dish", req.params.dishId);
            } else {
                return missing_record("Comment", req.params.commentId);
            }
        } , (err) => next(err))
        .catch((err) => next(err));
}).delete((req, res, next) => {
    Dishes.findById(req.params.dishId)
        .then((dish) => {
            if (null != dish && null != dish.comments.id(req.params.commentId)) {
                dish.comments.id(req.params.commentId).remove();
                dish.save().then((dish) => {
                    common.successResponse(res, dish);
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