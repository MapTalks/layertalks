describe('Map.Anim', function () {

    var container;
    var map;
    var center = new maptalks.Coordinate(118.846825, 32.046534);

    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '2px';
        container.style.height = '2px';
        document.body.appendChild(container);
        var option = {
            zoomAnimation:false,
            zoom: 17,
            center: center
        };
        map = new maptalks.Map(container, option);
    });

    afterEach(function () {
        map.remove();
        REMOVE_CONTAINER(container);
    });

    it('animateTo', function (done) {
        var center = map.getCenter().add(0.1, 0.1);
        var zoom = map.getZoom() - 1;
        var pitch = map.getPitch() + 10;
        var bearing = map.getBearing() + 60;
        map.getBaseLayer().config('durationToAnimate', 300);
        map.on('animateend', function () {
            expect(map.getCenter().toArray()).to.be.closeTo(center.toArray());
            expect(map.getZoom()).to.be.eql(zoom);
            expect(map.getPitch()).to.be.eql(pitch);
            expect(map.getBearing()).to.be.approx(bearing);
            done();
        });
        map.animateTo({
            center : center,
            zoom : zoom,
            pitch : pitch,
            bearing : bearing
        }, {
            'duration' : 300
        });
    });

    it('interupt animateTo', function (done) {
        var center = map.getCenter().add(0.1, 0.1);
        var zoom = map.getZoom() - 4;
        var pitch = map.getPitch() + 10;
        var bearing = map.getBearing() + 60;
        map.on('animateinterupted', function () {
            expect(map.getCenter().toArray()).not.to.be.closeTo(center.toArray());
            expect(map.getZoom()).to.be.eql(zoom);
            expect(map.getPitch()).not.to.be.eql(pitch);
            expect(map.getBearing()).not.to.be.eql(bearing);
            done();
        });
        map.animateTo({
            center : center,
            zoom : zoom,
            pitch : pitch,
            bearing : bearing
        }, {
            'duration' : 200
        });
        setTimeout(function () {
            map.setCenter(map.getCenter().add(-0.1, 0));
        }, 100);
    });
});
