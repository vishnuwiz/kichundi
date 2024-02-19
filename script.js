const ctx = canvas.getContext("2d");

const Vec = (x, y) => ({x, y});
const setStyle = (ctx,style) => {    Object.keys(style).forEach(key => ctx[key] = style[key]) }
const createImage = (w,h) => {var i=document.createElement("canvas");i.width=w;i.height=h;i.ctx=i.getContext("2d");return i}
const textList = ["Yes, I'm Kundippenn 💘"];
var textPos = 0;
var w = canvas.width;
var h = canvas.height;
var cw = w / 2;  // center 
var ch = h / 2;
var globalTime;
var started = false;
requestAnimationFrame(update);

const mouse  = {x : 0, y : 0, button : false}
function mouseEvents(e){
	mouse.x = e.pageX;
	mouse.y = e.pageY;
	mouse.button = e.type === "mousedown" ? true : e.type === "mouseup" ? false : mouse.button;
}
["down","up","move"].forEach(name => document.addEventListener("mouse"+name,mouseEvents));

function onResize(){ 
	cw = (w = canvas.width = innerWidth) / 1;
	ch = (h = canvas.height = innerHeight) / 1;
    if (!started) { startIt() }
}

function update(timer){
    globalTime = timer;
    ctx.setTransform(1,0,0,1,0,0); // reset transform
    ctx.globalAlpha = 1;           // reset alpha
	if (w !== innerWidth || h !== innerHeight){ onResize() }
	else { ctx.clearRect(0,0,w,h) }
    particles.update();
  particles.draw();	
    requestAnimationFrame(update);
}


function createParticles(text){
    createTextMap(
        text, 60, "Arial", 
        {   fillStyle : "#262729", strokeStyle : "#262729", lineWidth : 0, lineJoin : "round", },
        { top : 0, left : 0, width : canvas.width, height : canvas.height }
    )
}
// This function starts the animations
function startIt(){
    started = true;
    const next = ()=>{
        var text = textList[(textPos++ ) % textList.length];
        createParticles(text);
        setTimeout(moveOut,text.length * 100 + 100000);
    }
    const moveOut = ()=>{
        particles.moveOut();
        setTimeout(next,2000);
    }
    setTimeout(next,0);
}



// the following function create the particles from text using a canvas
// the canvas used is displayed on the main canvas top left fro reference.
var tCan = createImage(100, 100); // canvas used to draw text
function createTextMap(text,size,font,style,fit){
    const hex = (v)=> (v < 16 ? "0" : "") + v.toString(16);
    tCan.ctx.font = size + "px " + font;
    var width = Math.ceil(tCan.ctx.measureText(text).width + size);
    tCan.width = width;
    tCan.height = Math.ceil(size *1.2);
    var c = tCan.ctx;
    c.font = size + "px " + font;
    c.textAlign = "center";
    c.textBaseline = "middle";
    setStyle(c,style);
    if (style.strokeStyle) { c.strokeText(text, width / 2, tCan.height / 2) }
    if (style.fillStyle) { c.fillText(text, width / 2, tCan.height/ 2) }
    particles.empty();
    var data = c.getImageData(0,0,width,tCan.height).data;
    var x,y,ind,rgb,a;
    for(y = 0; y < tCan.height; y += 1){
        for(x = 0; x < width; x += 1){
            ind = (y * width + x) << 2;  // << 2 is equiv to * 4
            if(data[ind + 3] > 128){  // is alpha above half
                rgb = `#${hex(data[ind ++])}${hex(data[ind ++])}${hex(data[ind ++])}`;
                particles.add(Vec(x, y), Vec(x, y), rgb);
            }
        }
    }
    particles.sortByCol
    var scale = Math.min(fit.width / width, fit.height / tCan.height);
    particles.each(p=>{
        p.home.x = ((fit.left + fit.width) / 2) + (p.home.x - (width / 2)) * scale;
        p.home.y = ((fit.top + fit.height) / 2) + (p.home.y - (tCan.height / 2)) * scale;

    })
        .findCenter() // get center used to move particles on and off of screen
        .moveOffscreen()  // moves particles off the screen
        .moveIn();        // set the particles to move into view.

}

// basic particle
const particle = { pos : null,  delta : null, home : null, col : "black", }
// array of particles
const particles = {
    items : [], // actual array of particles
    mouseFX : {  power : 12,dist :110, curve : 2, on : true },
    fx : { speed : 0.3, drag : 0.6, size : 4, jiggle : 1 },
    // direction 1 move in -1 move out
    direction : 1,
    moveOut () {this.direction = -1; return this},
    moveIn () {this.direction = 1; return this},
    length : 0, 
    each(callback){ // custom iteration 
        for(var i = 0; i < this.length; i++){   callback(this.items[i],i) }
        return this;
    },
    empty() { this.length = 0; return this },
    deRef(){  this.items.length = 0; this.length = 0 },
    sortByCol() {  this.items.sort((a,b) => a.col === b.col ? 0 : a.col < b.col ? 1 : -1 ) },
    add(pos, home, col){  // adds a particle
        var p;
        if(this.length < this.items.length){
            p = this.items[this.length++];
            p.home.x = home.x;
			p.home.y = home.y;
            p.delta.x = 0;
            p.delta.y = 0;
            p.col = col;
        }else{
            this.items.push( Object.assign({}, particle,{ pos, home, col, delta : Vec(0,0) } ) );
            this.length = this.items.length
        }
        return this;
    },
    draw(){ // draws all
        var p, size, sizeh;
        sizeh = (size = this.fx.size) / 2;
        for(var i = 0; i < this.length; i++){
            p = this.items[i];
            ctx.fillStyle = p.col;
            ctx.fillRect(p.pos.x - sizeh, p.pos.y - sizeh, size, size);
        }
    },
    update(){ // update all particles
        var p,x,y,d;
        const mP = this.mouseFX.power;
        const mD = this.mouseFX.dist;
        const mC = this.mouseFX.curve;
        const fxJ = this.fx.jiggle;
        const fxD = this.fx.drag;
        const fxS = this.fx.speed;

        for(var i = 0; i < this.length; i++){
            p = this.items[i];
            p.delta.x += (p.home.x - p.pos.x ) * fxS + (Math.random() - 0.5) * fxJ;
            p.delta.y += (p.home.y - p.pos.y ) * fxS + (Math.random() - 0.5) * fxJ;
            p.delta.x *= fxD;
            p.delta.y *= fxD;
            p.pos.x += p.delta.x * this.direction;
            p.pos.y += p.delta.y * this.direction;
            if(this.mouseFX.on){
                x = p.pos.x - mouse.x;
                y = p.pos.y - mouse.y;
                d = Math.sqrt(x * x + y * y);
                if(d < mD){
                    x /= d;
                    y /= d;
                    d /= mD;
                    d = (1-Math.pow(d, mC)) * mP;
                    p.pos.x += x * d;
                    p.pos.y += y * d;        
                }
            }
        }
        return this;
    },
    findCenter(){  // find the center of particles maybe could do without
        var x,y;
        y = x = 0;
        this.each(p => { x += p.home.x; y += p.home.y });
        this.center = Vec(x / this.length, y / this.length);
        return this;
    },
    moveOffscreen(){  // move start pos offscreen
        var dist,x,y;
        dist = Math.sqrt(this.center.x * this.center.x + this.center.y * this.center.y);
        
        this.each(p => {
            var d;
            x = p.home.x - this.center.x;
            y = p.home.y - this.center.y;
            d =  Math.max(0.0001,Math.sqrt(x * x + y * y)); // max to make sure no zeros
            p.pos.x = p.home.x + (x / d)  * dist;
            p.pos.y = p.home.y + (y / d)  * dist;
        });
        return this;
    },
}





