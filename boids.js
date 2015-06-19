
//https://github.com/skeeto/boids-js
function Boid(swarm) {
    this.x = Math.random() * swarm.width;
    this.y = Math.random() * swarm.height;
    this.heading = Math.random() * 2 * Math.PI - Math.PI;
}

Boid.prototype.radius = 5;
Boid.prototype.speed = 3;
Boid.prototype.radialSpeed = Math.PI / 50;
Boid.prototype.vision = 150;

Boid.prototype.draw = function(ctx) {
    var pointLen = this.radius * 2.5;
    ctx.fillStyle = 'blue';          
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(this.x + Math.cos(this.heading + Math.PI / 2) * this.radius,     
               this.y + Math.sin(this.heading + Math.PI / 2) * this.radius);    
    ctx.lineTo(this.x - Math.cos(this.heading + Math.PI) * pointLen,            
               this.y - Math.sin(this.heading + Math.PI) * pointLen);           
    ctx.lineTo(this.x + Math.cos(this.heading - Math.PI / 2) * this.radius,     
               this.y + Math.sin(this.heading - Math.PI / 2) * this.radius);    
    ctx.fill();
};

Boid.prototype.distance = function(boid, width, height) {
    var x0 = Math.min(this.x, boid.x), x1 = Math.max(this.x, boid.x);
    var y0 = Math.min(this.y, boid.y), y1 = Math.max(this.y, boid.y);
    var dx = Math.min(x1 - x0, x0 + width - x1);
    var dy = Math.min(y1 - y0, y0 + height - y1);
    return Math.sqrt(dx * dx + dy * dy);
};

Boid.prototype.getNeighbors = function(swarm) {
    var w = swarm.width, h = swarm.height;
    var neighbors = [];
    for (var i = 0; i < swarm.boids.length; i++) {
        var boid = swarm.boids[i];
        if (this !== boid && this.distance(boid, w, h) < this.vision) {
            neighbors.push(boid);
        }
    }
    return neighbors;
};

Boid.wrap = function(value) {
    var min, max;
    if (arguments.length === 2) {
        min = 0;
        max = arguments[1];
    } else if (arguments.length === 3) {
        min = arguments[1];
        max = arguments[2];
    } else {
        throw new Error('wrong number of arguments');
    }
    while (value >= max) value -= (max - min);
    while (value < min) value += (max - min);
    return value;
};

Boid.clamp = function(value, limit) {
    return Math.min(limit, Math.max(-limit, value));
};

Boid.meanAngle = function() {
    var sumx = 0, sumy = 0, len = arguments.length;
    for (var i = 0; i < len; i++) {
        sumx += Math.cos(arguments[i]);
        sumy += Math.sin(arguments[i]);
    }
    return Math.atan2(sumy / len, sumx / len);
};

Boid.prototype.step = function(swarm) {
    var w = swarm.width, h = swarm.height;
    var neighbors = this.getNeighbors(swarm);
    if (neighbors.length > 0) {
        var meanhx = 0, meanhy = 0;
        var meanx = 0, meany = 0;
        var mindist = this.radius * 2 + 5, min = null;
        for (var i = 0; i < neighbors.length; i++) {
            var boid = neighbors[i];
            meanhx += Math.cos(boid.heading);
            meanhy += Math.sin(boid.heading);
            meanx += boid.x;
            meany += boid.y;
            var dist = this.distance(boid, w, h);
            if (dist < mindist) {
                mindist = dist;
                min = boid;
            }
        }
        meanhx /= neighbors.length;
        meanhy /= neighbors.length;
        meanx /= neighbors.length;
        meany /= neighbors.length;

        var target;
        if (min) {
            // Keep away!
            target = Math.atan2(this.y - min.y, this.x - min.x);
        } else {
            // Match heading and move towards center
            var meanh = Math.atan2(meanhy, meanhx);
            var center = Math.atan2(meany - this.y, meanx - this.x);
            target = Boid.meanAngle(meanh, meanh, meanh, center);
        }

        // Move in this direction
        var delta = Boid.wrap(target - this.heading, -Math.PI, Math.PI);
        delta = Boid.clamp(delta, this.radialSpeed);
        this.heading = Boid.wrap(this.heading + delta, -Math.PI, Math.PI);
    }

    this.move(swarm);
};

Boid.prototype.move = function(swarm) {
    var padding = swarm.padding;
    var width = swarm.width, height = swarm.height;
    this.x = Boid.wrap(this.x + Math.cos(this.heading) * this.speed,
                       -padding, width + padding * 2);
    this.y = Boid.wrap(this.y + Math.sin(this.heading) * this.speed,
                       -padding, height + padding * 2);
};

/* Swam prototype. */

function Swarm(ctx) {
    this.ctx = ctx;
    this.boids = [];
    var swarm = this;
    this.animate = function() {
    	swarmHawk.colision(swarm);
        Swarm.step(swarm);
        swarmHawk.animate();

    };
    this.padding = 8;
}

Swarm.prototype.createBoid = function(n) {
    for (var i = 0; i < (n || 1); i++) {
        this.boids.push(new Boid(this));
    }
};

Swarm.prototype.clear = function() {
    this.boids = [];
};

Object.defineProperty(Swarm.prototype, 'width', {get: function() {
    return this.ctx.canvas.width;
}});

Object.defineProperty(Swarm.prototype, 'height', {get: function() {
    return this.ctx.canvas.height;
}});

Swarm.step = function (swarm) {
    var ctx = swarm.ctx;
    if (ctx.canvas.width != window.innerWidth)  
        ctx.canvas.width = window.innerWidth;      
    if (ctx.canvas.height != window.innerHeight)   
        ctx.canvas.height = window.innerHeight;     
    ctx.clearRect(0, 0, swarm.width, swarm.height);
    for (var i = 0; i < swarm.boids.length; i++) {
        swarm.boids[i].step(swarm);
        swarm.boids[i].draw(ctx);
    }
};

/* BoidHawk prototype */

function BoidHawk(swarmHawk) {
    this.x = Math.random() * swarmHawk.width;
    this.y = Math.random() * swarmHawk.height;
    this.heading = Math.random() * 2 * Math.PI - Math.PI;
}

BoidHawk.prototype.radius = 6;
BoidHawk.prototype.speed = 3;
BoidHawk.prototype.radialSpeed = Math.PI / 50;
BoidHawk.prototype.vision = 150;

BoidHawk.prototype.draw = function(ctx) {
	document.getElementById('hawks').innerHTML = "Hawks: " + swarmHawk.boids.length;
	document.getElementById('birds').innerHTML = "Birds: " + swarm.boids.length;
    var pointLen = this.radius * 2.5;
    ctx.fillStyle = 'red'; 
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(this.x + Math.cos(this.heading + Math.PI / 2) * this.radius,    
               this.y + Math.sin(this.heading + Math.PI / 2) * this.radius);    
    ctx.lineTo(this.x - Math.cos(this.heading + Math.PI) * pointLen,            
               this.y - Math.sin(this.heading + Math.PI) * pointLen);           
    ctx.lineTo(this.x + Math.cos(this.heading - Math.PI / 2) * this.radius,     
               this.y + Math.sin(this.heading - Math.PI / 2) * this.radius);    
    ctx.fill();
};

BoidHawk.prototype.distance = function(boid, width, height) {
    var x0 = Math.min(this.x, boid.x), x1 = Math.max(this.x, boid.x);
    var y0 = Math.min(this.y, boid.y), y1 = Math.max(this.y, boid.y);
    var dx = Math.min(x1 - x0, x0 + width - x1);
    var dy = Math.min(y1 - y0, y0 + height - y1);
    return Math.sqrt(dx * dx + dy * dy);
};

SwarmHawk.prototype.colision = function(swarm){
	for(var i=0; i<swarmHawk.boids.length; i++){
		for(var j=0; j<swarm.boids.length; j++){
			var dx = swarmHawk.boids[i].x - swarm.boids[j].x;
			var dy = swarmHawk.boids[i].y - swarm.boids[j].y;
			var dis = Math.sqrt(dx*dx + dy*dy);
			if (dis <= 5){
				swarm.boids.splice(j,1);
			}
		}
	}
};

BoidHawk.prototype.getNeighbors = function(swarmHawk) {
    var w = swarmHawk.width, h = swarmHawk.height;
    var neighbors = [];
    for (var i = 0; i < swarmHawk.boids.length; i++) {
        var boid = swarmHawk.boids[i];
        if (this !== boid && this.distance(boid, w, h) < this.vision) {
            neighbors.push(boid);
        }
    }
    return neighbors;
};

BoidHawk.wrap = function(value) {
    var min, max;
    if (arguments.length === 2) {
        min = 0;
        max = arguments[1];
    } else if (arguments.length === 3) {
        min = arguments[1];
        max = arguments[2];
    } else {
        throw new Error('wrong number of arguments');
    }
    while (value >= max) value -= (max - min);
    while (value < min) value += (max - min);
    return value;
};

BoidHawk.clamp = function(value, limit) {
    return Math.min(limit, Math.max(-limit, value));
};

BoidHawk.meanAngle = function() {
    var sumx = 0, sumy = 0, len = arguments.length;
    for (var i = 0; i < len; i++) {
        sumx += Math.cos(arguments[i]);
        sumy += Math.sin(arguments[i]);
    }
    return Math.atan2(sumy / len, sumx / len);
};

BoidHawk.prototype.step = function(swarmHawk) {
    var w = swarmHawk.width, h = swarmHawk.height;
    var neighbors = this.getNeighbors(swarmHawk);
    if (neighbors.length > 0) {
        var meanhx = 0, meanhy = 0;
        var meanx = 0, meany = 0;
        var mindist = this.radius * 2 + 5, min = null;
        for (var i = 0; i < neighbors.length; i++) {
            var boid = neighbors[i];
            meanhx += Math.cos(boid.heading);
            meanhy += Math.sin(boid.heading);
            meanx += boid.x;
            meany += boid.y;
            var dist = this.distance(boid, w, h);
            if (dist < mindist) {
                mindist = dist;
                min = boid;
            }
        }
        meanhx /= neighbors.length;
        meanhy /= neighbors.length;
        meanx /= neighbors.length;
        meany /= neighbors.length;

        var target;
        if (min) {
            // Keep away!
            target = Math.atan2(this.y - min.y, this.x - min.x);
        } else {
            // Match heading and move towards center
            var meanh = Math.atan2(meanhy, meanhx);
            var center = Math.atan2(meany - this.y, meanx - this.x);
            target = BoidHawk.meanAngle(meanh, meanh, meanh, center);
        }

        // Move in this direction
        var delta = BoidHawk.wrap(target - this.heading, -Math.PI, Math.PI);
        delta = BoidHawk.clamp(delta, this.radialSpeed);
        this.heading = BoidHawk.wrap(this.heading + delta, -Math.PI, Math.PI);
    }
    this.move(swarmHawk);
};

BoidHawk.prototype.move = function(swarmHawk) {
    var padding = swarmHawk.padding;
    var width = swarmHawk.width, height = swarmHawk.height;
    this.x = BoidHawk.wrap(this.x + Math.cos(this.heading) * this.speed,
                       -padding, width + padding * 2);
    this.y = BoidHawk.wrap(this.y + Math.sin(this.heading) * this.speed,
                       -padding, height + padding * 2);
};

/* Swam prototype. */

function SwarmHawk(ctx) {
    this.ctx = ctx;
    this.boids = [];
    var swarmHawk = this;
    this.animate = function() {
        SwarmHawk.step(swarmHawk);
    };
    this.padding = 8;
}

SwarmHawk.prototype.createBoidHawk = function(n) {
    for (var i = 0; i < (n || 1); i++) {
        this.boids.push(new BoidHawk(this));
    }
};

SwarmHawk.prototype.clear = function() {
    this.boids = [];
};

Object.defineProperty(SwarmHawk.prototype, 'width', {get: function() {
    return this.ctx.canvas.width;
}});

Object.defineProperty(SwarmHawk.prototype, 'height', {get: function() {
    return this.ctx.canvas.height;
}});

SwarmHawk.step = function (swarmHawk) {
    var ctx = swarmHawk.ctx;
    if (ctx.canvas.width != window.innerWidth)     
        ctx.canvas.width = window.innerWidth;     
    if (ctx.canvas.height != window.innerHeight)    
        ctx.canvas.height = window.innerHeight; 
    for (var i = 0; i < swarmHawk.boids.length; i++) {
        swarmHawk.boids[i].step(swarmHawk);
        swarmHawk.boids[i].draw(ctx);
    }
};

/* Test */

var swarm;
var swarmHawk;
$(document).ready(function() {
    swarm = new Swarm($('#canvas').get(0).getContext('2d'));
    swarmHawk = new SwarmHawk($('#canvas').get(0).getContext('2d'));
    swarm.id = setInterval(swarm.animate, 33);
    swarm.animate();
    swarm.clear();
    swarm.createBoid(prompt("Amount of birds"));
    swarmHawk.clear();
    swarmHawk.createBoidHawk(prompt("Amount of hawks"));
});
