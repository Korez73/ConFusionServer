const express = require('express');
const Favorites = require('../models/favorite');
const cors = require('./cors');
const authenticate = require('../authenticate');

const favoriteRouter = express.Router();
favoriteRouter.use(express.urlencoded({extended: true}));
favoriteRouter.use(express.json());


const posterror = (res, err) => {
    res.statusCode = 400;
    console.log("POST error in /favorites");
    console.log(err.toString());
    res.end("You probably did someting wrong in your POST: " + err.toString());
} 

favoriteRouter.route('/')
.options(cors.corsWithOptions, (_req, res) => {res.status(200); })
.get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.find({user: req.user._id})
        .populate('user').populate('dishes')
        .then((favorites) => {
            res.json(favorites);   
        }, (err) => next(err))
        .catch((err) => next(err));
}).post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    
    if(!req.body.filter) {
        posterror(res, new Error("The body was not in the expected format"));
    }

    const userId = req.user._id;
    
    //dedupe the body
    dbody = req.body.filter((ele, index, self) =>
        index === self.findIndex((b) => (
            b._id === ele._id
    )));

    Favorites.findOne({user: userId})
        .then((favorite) => {
            if (null === favorite) {
                Favorites.create({user: userId, dishes: dbody})
                .then((favorite) => {
                    res.json(favorite);
                }, (err) => { posterror(res, err); });
            } else {
                favorite.dishes = dbody;
                favorite.save().then((favorite) => {
                    res.json(favorite);
                }, (err) => { posterror(res, err); });
            }
        }, (err) => { next(err); })
        .catch((err) => { next(err); });

}).delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, _next) => {
    Favorites.remove({user: req.user._id})
    .then((resp) => res.json(resp), (err) => next(err))
    .catch((err) => next(err));
})


favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (_req, res) => {res.status(200); })
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    
    const dishId = req.params.dishId;
    const userId = req.user._id;

    Favorites.findOne({user: userId})
        .then((favorite) => {
            if (null != favorite) {

                for (var i = (favorite.dishes.length-1); i >= 0; i--) {
                    if(favorite.dishes[i].equals(dishId)) {
                        //the dish already exists, return
                        res.json(favorite);
                    }
                }
                
                favorite.dishes.push(dishId);
                favorite.save().then((favorite) => {
                    res.json(favorite);
                });
            } else {
                Favorites.create({user: userId, dishes: [dishId]})
                .then((favorite) => {
                    res.json(favorite);
                }, (err) => next(err))
            }
        }, (err) => next(err))
        .catch((err) => next(err));
}).delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({user: req.user._id})
    .then((favorite) => {
        if (null === favorite) 
        { 
            res.json({});
        };
        favorite.dishes = favorite.dishes.filter(d => !d.equals(req.params.dishId));
        favorite.save().then((favorite) => {
             res.json(favorite);
        }, (err) => next(err));
    }).catch((err) => next(err));
});

module.exports = favoriteRouter;

