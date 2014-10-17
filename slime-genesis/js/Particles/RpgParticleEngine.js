(function(){
	RpgParticleEngine = function( render )
	{
		this.render    = render;
		this.set       = {};
		this.particles = {};

		this.initialize = function( name )
		{
			var set       = RpgParticlesSet[name];
			var sprite    = THREE.ImageUtils.loadTexture( set.texture );
			var geometry = new THREE.Geometry();
			for(i = 0; i < set.count; i ++)
			{
				var vertex = new THREE.Vector3();
				vertex.x = (Math.random() * (set.box[0] * 2)) - set.box[0];
				vertex.y = (Math.random() * (set.box[1] * 2)) - set.box[1];
				vertex.z = (Math.random() * (set.box[2] * 2)) - set.box[2];
				geometry.vertices.push( vertex );
			};
console.log(THREE.PointCloudMaterial);
			var material = new THREE.PointCloudMaterial( { size: set.size, map: sprite, blending: THREE.AdditiveBlending, depthTest: false, transparent : true } );
			material.color.setHSL( set.color[0], set.color[1], set.color[2] );
			this.particles = new THREE.PointCloud( geometry, material );
			this.particles.rotation.x = Math.random() * 6;
			this.particles.rotation.y = Math.random() * 6;
			this.particles.rotation.z = Math.random() * 6;
			this.render.addToScene( this.particles );
			this.set = set;
		};

		this.update = function(delta)
		{
			var size = delta / 10;//this.set.speedDivider;
			this.particles.rotation.y += size;
			this.particles.rotation.x += size;
			this.particles.rotation.y += size;
		};
	};
})();