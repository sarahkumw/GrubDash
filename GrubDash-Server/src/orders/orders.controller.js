const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res) {
    res.json({ data: orders })
}

function orderExists(req, res, next) {
    const orderId = req.params.orderId;
    const foundOrder = orders.find((order) => order.id === orderId);
    if (foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }
    next({
        status: 404,
        message: `Order not found with id: ${orderId}`
    })
}

function correctId(req, res, next) {
    const reqId = req.body.data.id;
    if(reqId) {
        const orderId = req.params.orderId;
        if(orderId === reqId) {
            return next();
        }
        next({
            status: 400,
            message: `Order id does not match route id. Dish: ${reqId}, Route: ${orderId}
            `
        });
    }
    next();
}

function validDeliverTo(req, res, next) {
    const reqDeliverTo = req.body.data.deliverTo;
    if(reqDeliverTo && reqDeliverTo.length > 0) {
        res.locals.deliverTo = reqDeliverTo;
        return next();
    }
    next({
        status: 400,
        message: "Order must include a deliverTo"
    });
}

function validMobileNumber(req, res, next) {
    const reqMobileNumber = req.body.data.mobileNumber;
    if(reqMobileNumber && reqMobileNumber.length > 0) {
        res.locals.mobileNumber = reqMobileNumber;
        return next();
    }
    next({
        status: 400,
        message: "Order must include a mobileNumber"
    });
}

function validDishes(req, res, next) {
    const reqDishes = req.body.data.dishes;
    if (reqDishes) {
        if(Array.isArray(reqDishes) && reqDishes.length > 0) {
            res.locals.dishes = reqDishes;
            return next();
        }
        next({
            status: 400,
            message: "Order must include at least one dish"
        });
    }
    next({
        status: 400,
        message: "Order must include a dish"
    });
}

function validQuantity(req, res, next) {
    const dishes = res.locals.dishes;
    dishes.forEach((dish) => {
        const index = dishes.indexOf(dish);
        const quantity = dish.quantity;
        if (!quantity || !Number.isInteger(quantity) || !Number(quantity) > 0) {
            return next({
                status: 400,
                message: `Dish ${index} must have a quantity that is an integer greater than 0
                `
            });
        }
    });
    next();
}

function validStatus(req, res, next) {
    const status = req.body.data.status;
    const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"]
    if (status && status.length > 0 && validStatus.includes(status)) {
        if(status !== "delivered") {
            return next()
        }
        return next({
            status: 400,
            message: "A delivered order cannot be changed"
        });
    }
    next({
        status: 400,
        message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
    })
}

function isPending(req, res, next) {
    const order = res.locals.order;
    if(order.status === "pending") {
        return next();
    }
    next({
        status: 400,
        message: "An order cannot be deleted unless it is pending"
    });
}

function read(req, res){
    const foundOrder = res.locals.order;
    res.json({ data: foundOrder })
}

function create(req, res) {
    const newOrder = {
        id: nextId(),
        deliverTo: res.locals.deliverTo,
        mobileNumber: res.locals.mobileNumber,
        status: "pending",
        dishes: res.locals.dishes
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder})
}

function update(req, res) {
    let foundOrder = res.locals.order;
    const updatedOrder = {
        id: foundOrder.id,
        deliverTo: res.locals.deliverTo,
        mobileNumber: res.locals.mobileNumber,
        status: req.body.data.status,
        dishes: res.locals.dishes
    };
    if (foundOrder !== updatedOrder) {
        foundOrder = updatedOrder;
    }
    res.json({ data: foundOrder })
}

function destroy(req, res) {
    const order = res.locals.order;
    const index = orders.indexOf(order);
    orders.splice(index, 1);
    res.sendStatus(204)
}

module.exports = {
    list,
    read: [orderExists, read],
    create: [validDeliverTo, validMobileNumber, validDishes, validQuantity, create],
    update: [orderExists, correctId, validDeliverTo, validMobileNumber, validDishes, validQuantity, validStatus, update],
    destroy: [orderExists, isPending, destroy],
}