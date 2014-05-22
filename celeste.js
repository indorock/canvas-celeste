var Celeste = function(){

    var args = arguments[0];
    this.stage = null;
    this.layer = null;
    this.coverage = 0;
    this.covered = 0;
    this.baseStar = null;
    this.density = 'medium';
    this.background = '#000011';
    this.minSize = 1;
    this.maxSize = 5;
    this.beginOpacity = 1;
    this.endOpacity = 0.3;
    this.twinkle = true;
    this.twinkleInterval = 50;
    this.container = 'sky';
    this.stars = [];
    this.meteor = null;
    this.canvasWidth = window.innerWidth;
    this.canvasHeight = window.innerHeight-4;

    this.init = function(args){
        this.loadArgs(args);

        this.stage = new Kinetic.Stage({
            container: this.container,
            width: this.canvasWidth,
            height: this.canvasHeight,
            style: this.background
        });

        this.layer = new Kinetic.Layer();
        document.getElementById(this.container).style.backgroundColor = this.background;

        this.generateStars();
        this.shootMeteors();
        this.stage.add(this.layer);
    };

    this.reload = function(args){
        this.loadArgs(args);
        if(args.density){
            this.stage.clear();
            this.layer.destroy();
            this.generateStars();
            this.shootMeteors();
            this.stage.add(this.layer);
        }
        if(args.twinkleInterval){
            this.loadStarArgs(args);
        }
        if(args.meteorFrequency || args.meteorMinSpeed || args.meteorMaxSpeed){
            this.loadMeteorArgs(args);
        }

        document.getElementById(this.container).style.backgroundColor = this.background;
    };

    this.loadArgs = function(args){
        for(a in args){
            this[a] = args[a];
        }
    };

    this.loadStarArgs = function(args){
        var that = this;
        this.stars.map(function(s){
            s.loadArgs(args)
            if(args.twinkleInterval){
                clearTimeout(s.tw);
                s.twinkle({twinkleInterval: args.twinkleInterval}, s, that);
            }
        });
    };

    this.loadMeteorArgs = function(args){
        if(args.meteorFrequency){
            this.meteor.frequency =  args.meteorFrequency;
            console.log(this.meteor.frequency);
        }
        if(args.meteorMinSpeed) this.meteor.minSpeed =  args.meteorMinSpeed;
        if(args.meteorMaxSpeed) this.meteor.maxSpeed =  args.meteorMaxSpeed;
    };

    this.generateStars = function(){
        this.covered = 0;
        var skypixels = (window.innerHeight*window.innerWidth);
        switch(this.density){
            case 'low':
            case 1: // with twinkle around 25% CPU
                this.coverage = skypixels/10000;
                break;
            case 'medium':
            case 2: // with twinkle around 60% CPU
                this.coverage = skypixels/5000;
                break;
            case 'high':
            case 3: // with twinkle close to 100% CPU
                this.coverage = skypixels/2000;
                break;
            case 'interstellar':
            case 4: // with twinkle use at your own risk ;)
                this.coverage = skypixels/200;
                break;
            default:
                this.coverage = skypixels/5000;
                break;
        }
        this.coverage = Math.floor(this.coverage);
        while(this.covered < this.coverage){
            var star = this.createStar();
            this.layer.add(star);
            this.stars[this.stars.length] = star;
        }
    }

    this.createStar = function(){
        var red = 255;
        var green = 255;
        var blue = 255;
        var alpha = 255;

        if(this.baseStar == null)
            this.baseStar = new Star({radius: this.maxSize/2});

        var starsize = (Math.floor(Math.random()*(this.maxSize - this.minSize)) + this.minSize);
        var posx = Math.floor(Math.random()*this.stage.getWidth());
        var posy = Math.floor(Math.random()*this.stage.getHeight());
        var style = "rgba("+red+","+green+","+blue+","+(alpha/255)+")";
        var star = this.baseStar.clone({x: posx, y: posy, radius: Math.floor(starsize/2), fill: style, opacity: this.beginOpacity});
        this.covered = this.covered + starsize;
        if(this.twinkle && this.twinkleInterval){
            star.twinkle({beginOpacity: this.beginOpacity, endOpacity: this.endOpacity, twinkleInterval: this.twinkleInterval}, star, this);
        }
        return star;
    };

    this.shootMeteors = function(){
        this.meteor = this.createMeteor();
        this.meteor.shoot(this.layer);
        var that = this;
    };

    this.createMeteor = function(){
        var meteor = new Meteor();
        this.layer.add(meteor);
        this.layer.draw();
        return meteor;
    }

    this.init(args);
}


var Star = function(){

    this.beginOpacity = 1;
    this.endOpacity = 0.3;
    this.twinkleState = 0;
    this.twinkleInterval = 50;
    this.tw = null;

    args = {
        x: window.innerWidth/2,
        y: window.innerHeight/2,
        radius: 5,
        fill: '#ffffff'
    };
    for(var a in arguments[0]) args[a] = arguments[0][a];
    Kinetic.Circle.call(this, args);

    this.loadArgs = function(args){
        for(a in args){
            this[a] = args[a];
        }
    };

    this.clone = function(args){
        var attrs = Kinetic.Util.cloneObject(this.attrs), key, allListeners, len, n, listener;

        for (key in args) {
            if(key != 'id')
                attrs[key] = args[key];
        }

        var star = new Star(attrs);
        // copy over listeners
        for(key in this.eventListeners) {
            allListeners = this.eventListeners[key];
            len = allListeners.length;
            for(n = 0; n < len; n++) {
                listener = allListeners[n];
                /*
                 * don't include kinetic namespaced listeners because
                 *  these are generated by the constructors
                 */
                if(listener.name.indexOf('kinetic') < 0) {
                    // if listeners array doesn't exist, then create it
                    if(!star.eventListeners[key]) {
                        star.eventListeners[key] = [];
                    }
                    star.eventListeners[key].push(listener);
                }
            }
        }
        return star;
    }

    this.twinkle = function(args, that, sky){
        if(args.beginOpacity) that.beginOpacity = args.beginOpacity;
        if(args.endOpacity) that.endOpacity = args.endOpacity;
        if(args.twinkleInterval) that.twinkleInterval = args.twinkleInterval;
        var timeout;

        if(!that.twinkleState){
            that.opacity(that.beginOpacity);
            that.twinkleState = 1;
            sky.stage.batchDraw();
            timeout = Math.floor((Math.random()*that.twinkleInterval/2)+(that.twinkleInterval/10));

        }else{
            that.opacity(that.endOpacity);
            that.twinkleState = 0;
            sky.stage.batchDraw();
            timeout = Math.random()/3;
        }
        that.tw = setTimeout(that.twinkle, timeout*1000, args, that, sky);
    };

}

Star.prototype = new Kinetic.Circle();

var Meteor = function(){

    this.minAngle = 10;
    this.maxAngle = 60;
    this.height = 150;
    this.minSpeed = 100; // 100 = 0.5 seconds
    this.maxSpeed = 150;
    this.speed = 120;
    this.frequency = 8000;
    this.anim = null;
    this.pos = {};
    this.posX = 0;
    this.angle = 0;
    this.layer = null;
    this.i = 0;
    this.to = null;

    args = {
        x: window.innerWidth/2,
        y: window.innerHeight/2,
        points: [2,0,1,this.height*0.9,0,this.height-4,1,this.height-1,2,this.height,3,this.height-1,4,this.height-4,3,this.height*0.9],
        fill: '#ffffff',
        tension: 0.3,
        opacity: 0.8,
        closed: true
    };
    for(var a in arguments[0]) args[a] = arguments[0][a];
    Kinetic.Line.call(this, args);

    this.shoot = function(layer){
        this.posX = Math.random()*window.innerWidth;
        this.setY(-this.height);
        this.setX(this.posX);
        this.layer = layer;

        this.angle = Math.random()*(this.maxAngle-this.minAngle)+this.minAngle;
        this.speed = Math.random()*(this.maxSpeed-this.minSpeed)+this.minSpeed;
        console.log(this.speed);
        this.rotate(this.angle);
        that = this;
        var interval = Math.random()*this.frequency;
        this.to = setTimeout(this.fall, interval, that, layer);
    }

    this.fall = function(that, layer){
        that.anim = new Kinetic.Animation(function(frame) {
            that.pos = that.getAbsolutePosition();
            that.setY(((frame.time/(50000/that.speed))*window.innerHeight)-that.height);
            that.opacity(20000/that.speed/((frame.time*frame.time)/50));
            var newpos = that.getAbsolutePosition()
            var yShift = that.pos.y - newpos.y;
            var xShift = Math.tan(that.angle*Math.PI/180) * yShift;
            that.setX(that.pos.x+xShift);
            that.i++;
            that.checkPos();
            if(!this.isRunning()){
                that.reset();
                that.shoot(layer);
            }
        }, layer);

        that.anim.start();
    }

    this.checkPos = function(){
        if(this.pos.y > window.innerHeight || this.i>200){
            this.anim.stop();
            this.anim = null;
        }
    }

    this.reset = function(){
        this.rotate(-this.angle);
        this.opacity(1);
        this.i = 0;
    }
}

Meteor.prototype = new Kinetic.Line();
