RpgParticlesSet = 
{
	snow: 
	{
		texture: 'slime-genesis/images/particles/snowflake.png',
		color: [1.0, 0.2, 0.3],
		size: 20,
		layers: 120,
		count: 700,
		box: [4096, 4096, 4096],
		speedDivider: 2.1,
		update: function( engine )
		{
			var that = RpgParticlesSet;
			return function(delta)
			{
				var layers = engine.particles.length;
				var maxY   = ((that.snow.box[1] * 2) * -1);
				while(--layers)
				{
					var position = engine.particles[layers].position;
					position.y -= engine.particlesSpeeds[layers] + delta;
					if(position.y < maxY) position.y = maxY * -1;
				}			

			}
		}
	}
}