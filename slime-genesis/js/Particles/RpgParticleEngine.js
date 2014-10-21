(function(){
	RpgParticleEngine = function( render )
	{
		this.render          = render;
		this.set             = {};
		this.particles       = [];
		this.particlesSpeeds = [];
		this.updateFunction  = {};

		this.initialize = function( name )
		{
			var set    = RpgParticlesSet[name];
			this.set   = set;
			var sprite = THREE.ImageUtils.loadTexture( set.texture );
			for(layer = 0; layer < set.layers; layer++)
			{
				var geometry = new THREE.Geometry();
				for(i = 0; i < set.count; i++)
				{
					var vertex = new THREE.Vector3();
					vertex.x = (Math.random() * (set.box[0] * 2)) - set.box[0];
					vertex.y = (Math.random() * (set.box[1] * 2)) - set.box[1];
					vertex.z = (Math.random() * (set.box[2] * 2)) - set.box[2];
					geometry.vertices.push( vertex );
				};
				var size = set.size * Math.random();
				var material = new THREE.PointCloudMaterial( { size: size, map: sprite, blending: THREE.AdditiveBlending, depthTest: false, transparent : true } );
				material.color.setHSL( set.color[0], set.color[1], set.color[2] );
				particlesLayer = new THREE.PointCloud( geometry, material );
				particlesLayer.rotation.x = Math.random() * 6;
				particlesLayer.rotation.y = Math.random() * 6;
				// particlesLayer.rotation.z = Math.random() * 6;
				this.render.addToScene( particlesLayer );
				this.particles.push( particlesLayer );
				var thridSpeed = set.speedDivider / 3;
				var particlesSpeed = thridSpeed + ((thridSpeed * 2) * Math.random());
				this.particlesSpeeds.push( particlesSpeed );
			}

			this.updateFunction = set.update( this );
		};

		this.update = function(delta)
		{
			this.updateFunction( delta );
			//var size = delta / 10;//this.set.speedDivider;
			//this.particles.position.y -= size;
			// this.particles.rotation.x += size;
			// this.particles.rotation.y += size;
		};
	};
})();