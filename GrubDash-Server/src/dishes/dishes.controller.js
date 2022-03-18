const { resolveSoa } = require("dns");
const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function dishExists(req, res, next) {
    const dishId = req.params.dishId;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish) {
        res.locals.dish = foundDish;
        return next();
    }
    next({
        status: 404,
        message: `Dish not found with id: ${dishId}`
    })
}

function correctId(req, res, next) {
    const reqId = req.body.data.id;
    if(reqId) {
        const dishId = req.params.dishId;
        if(dishId === reqId) {
            return next();
        }
        next({
            status: 400,
            message: `Dish id does not match route id. Dish: ${reqId}, Route: ${dishId}
            `
        });
    }
    next();
}

function validName(req, res, next) {
    const reqName = req.body.data.name;
    if(reqName && reqName.length !== 0) {
        res.locals.name = reqName;
        return next();
    }
    next({
        status: 400,
        message: "Dish must include a name"
    });
}

function validDescription(req, res, next) {
    const reqDescription = req.body.data.description;
    if(reqDescription && reqDescription.length !== 0) {
        res.locals.description = reqDescription;
        return next();
    }
    next({
        status: 400,
        message: "Dish must include a description"
    });
}

function validPrice(req, res, next) {
    const reqPrice = req.body.data.price;
    if(reqPrice) {
        if(Number.isInteger(reqPrice) && Number(reqPrice) > 0) {
            res.locals.price = reqPrice;
            return next();
        }
        next({
            status: 400,
            message: "Dish must have a price that is an integer greater than 0"
        });
    }
    next({
        status: 400,
        message: "Dish must include a price"
    });
}

function validImage(req, res, next) {
    const reqImage = req.body.data.image_url;
    if(reqImage && reqImage.length !== 0) {
        res.locals.image = reqImage;
        return next();
    }
    next({
        status: 400,
        message: "Dish must include a image_url"
    });
}

function list(req, res) {
    res.json({ data: dishes})
}

function read(req, res){
    const foundDish = res.locals.dish
    res.json({ data: foundDish })
} 

function create(req, res) {
    const newId = nextId();
    const newDish = {
        id: newId,
        name: res.locals.name,
        description: res.locals.description,
        price: res.locals.price,
        image_url: res.locals.image
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

function update (req, res) {
    let foundDish = res.locals.dish;
    if (req.body.data !== foundDish) {
        const updatedDish = {
            id: foundDish.id,
            name: res.locals.name,
            description: res.locals.description,
            price: res.locals.price,
            image_url: res.locals.image
        }
        foundDish = updatedDish;
        res.status(200).json({ data: updatedDish});
    }
}

module.exports = {
    list,
    read: [dishExists, read],
    create: [validName, validDescription, validPrice, validImage, create],
    update: [dishExists, correctId, validName, validDescription, validPrice, validImage, update]
}