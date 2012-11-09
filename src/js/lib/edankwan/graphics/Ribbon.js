/*
 * Ribbon.js
 * @author Edan Kwan
 * @version 1.0
 * Released under the GPL (Giant Penis License), which is an extension of GNU General Public License. In addition, You cannot remove the giant penis below when you use it.
 *
 *            ▄▄██▄██▄▄
 *          ▄█    █    █▄
 *         ▄█           █▄
 *         █             █
 *        █               █
 *        █               █
 *        █               █
 *        █               █
 *         █▄     █     ▄█
 *          █    ▄▄▄    █
 *          █           █
 *          █           █
 *          █           █
 *          █           █
 *          █           █
 *          █           █
 *          █           █
 *          █           █
 *          █           █
 *          █           █
 *          █           █
 *          █           █
 *    ▄████▄█           █▄████▄
 *  ▄█                         █▄
 * █                             █
 *█                               █
 *█                               █
 *█                               █
 *█             ▄▄█▄▄             █
 * █           █     █           █
 *  █▄       ▄█       █▄       ▄█
 *    █▄▄▄▄▄█           █▄▄▄▄▄█
 */


window.Ribbon = (function(){

    function Ribbon(radiusBase, radiusScale, radiusPower){

        this.radiusBase = radiusBase;
        this.radiusScale = radiusScale;
        this.radiusPower = radiusPower || 100;

    }

    var _p = Ribbon.prototype;


    function _getXYLength(x, y) {
        return Math.sqrt(x * x + y * y);
    }

    function _getIntersectionAngle(ax, ay, bx, by, cx, cy){
        /* the law of cosine */
        var a = _getXYLength(bx - cx, by - cy);
        var b = _getXYLength(cx - ax, cy - ay);
        var c = _getXYLength(ax - bx, ay - by);

        var baAngle = Math.atan2(ay - by, ax - bx);
        var bcAngle = Math.atan2(cy - by, cx - bx);
        var shortestAngle = bcAngle - baAngle;
        if (shortestAngle > Math.PI) shortestAngle -= Math.PI * 2;
        if (shortestAngle < -Math.PI) shortestAngle += Math.PI * 2;

        return (shortestAngle > 0 ? baAngle : bcAngle + Math.PI) + Math.acos((a * a - b * b + c * c) / (2 * a * c)) / 2;
    }


    function reset(x, y) {
        this.p0_x = x;
        this.p0_y = y;
        this.p0_radius = 0;
        this.p0_p0x = x;
        this.p0_p0y = y;
        this.p0_p1x = x;
        this.p0_p1y = y;

        this.p1_x = x;
        this.p1_y = y;
        this.p1_radius = 0;
        this.p1_p0x = x;
        this.p1_p0y = y;
        this.p1_p1x = x;
        this.p1_p1y = y;

        this.p2_x = x;
        this.p2_y = y;
        this.p2_p0x = x;
        this.p2_p0y = y;
        this.p2_p1x = x;
        this.p2_p1y = y;
        this.p2_c0x = x;
        this.p2_c0y = y;
        this.p2_c1x = x;
        this.p2_c1y = y;

        this.p3_p0x = x;
        this.p3_p0y = y;
        this.p3_p1x = x;
        this.p3_p1y = y;

        this.previousAngle = 0;
    }

    function update(x, y){
        var distance = _getXYLength(x - this.p0_x, y - this.p0_y);
        var radius = this.radiusScale * Math.pow(1 - distance / Ribbon.maxDistance, this.radiusPower);
        if (radius < 0) radius = 0;
        radius += this.radiusBase;

        /* shift data */
        this.p3_p0x = this.p2_p0x;
        this.p3_p0y = this.p2_p0y;
        this.p3_p1x = this.p2_p1x;
        this.p3_p1y = this.p2_p1y;

        this.p2_x = this.p1_x;
        this.p2_y = this.p1_y;
        this.p2_p0x = this.p1_p0x;
        this.p2_p0y = this.p1_p0y;
        this.p2_p1x = this.p1_p1x;
        this.p2_p1y = this.p1_p1y;

        this.p1_x = this.p0_x;
        this.p1_y = this.p0_y;
        this.p1_radius = this.p0_radius;

        this.p0_x = x;
        this.p0_y = y;
        this.p0_radius = radius;

        var angle = _getIntersectionAngle(this.p0_x, this.p0_y, this.p1_x, this.p1_y, this.p2_x, this.p2_y);
        if(isNaN(angle)) {
            angle = this.previousAngle;
        } else {
            this.previousAngle = angle;
        }

        this.p1_p0x = this.p1_x + this.p1_radius * Math.cos(angle);
        this.p1_p0y = this.p1_y + this.p1_radius * Math.sin(angle);
        this.p1_p1x = this.p1_x * 2 - this.p1_p0x;
        this.p1_p1y = this.p1_y * 2 - this.p1_p0y;

        distance = _getXYLength(this.p1_p0x - this.p2_p0x, this.p1_p0y - this.p2_p0y) / 2;
        angle = Math.atan2(this.p1_p0y - this.p3_p0y, this.p1_p0x - this.p3_p0x);
        this.p2_c0x = this.p2_p0x + Math.cos(angle) * distance;
        this.p2_c0y = this.p2_p0y + Math.sin(angle) * distance;

        distance = _getXYLength(this.p1_p1x - this.p2_p1x, this.p1_p1y - this.p2_p1y) / 2;
        angle = Math.atan2(this.p1_p1y - this.p3_p1y, this.p1_p1x - this.p3_p1x);
        this.p2_c1x = this.p2_p1x + Math.cos(angle) * distance;
        this.p2_c1y = this.p2_p1y + Math.sin(angle) * distance;
    }

    _p.reset = reset;
    _p.update = update;


    // Update this value with the screen length
    Ribbon.maxDistance = 1000;

    return Ribbon;

}());