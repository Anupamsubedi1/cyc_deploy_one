import Image from "next/image";

export default function LoadingScreen() {
	return (
		<div
			className="flex min-h-screen items-center justify-center bg-[#edf3f6] px-6"
			role="status"
			aria-label="Loading"
		>
			<div className="flex flex-col items-center justify-center gap-4 text-center">
				<div className="logo-loader">
					{/* Purely decorative — the role="status" above is what announces
					    the loading state, so the ring stays out of the a11y tree. */}
					<span className="logo-loader-ring" aria-hidden="true" />

					<div className="logo-loader-mark">
						{/* No `priority`: this placeholder is discarded as soon as the
						    page streams in, so preloading it only took bandwidth from
						    the hero image that determines LCP. */}
						<Image
							src="/images/cyc-logo-introduction.png"
							alt="CYC logo"
							fill
							sizes="(max-width: 640px) 112px, 144px"
							className="object-contain"
						/>
					</div>
				</div>
				<p className="text-center text-xl font-semibold text-slate-800 sm:text-2xl">The CYC Nepal Laghubitta Bittiya Sanstha Ltd.</p>
			</div>

			<style>
				{`
				/*
				  The loader box is deliberately much larger than the logo so the
				  ring clears the mark rather than crowding it — roughly 24px of
				  breathing room on mobile and 30px from tablet up.
				*/
				.logo-loader {
					position: relative;
					display: grid;
					place-items: center;
					width: 176px;
					height: 176px;
				}

				/*
				  The ring is a sibling of the logo rather than its parent, so the
				  mark stays upright while only the border spins.
				*/
				.logo-loader-ring {
					position: absolute;
					inset: 0;
					border-radius: 50%;
					border: 7px solid #C7E4D3;
					border-top-color: #007A8E;
					/* Promotes the ring to its own layer so the rotation is
					   composited and never repaints the logo underneath. */
					will-change: transform;
					animation: logo-loader-spin 1.5s linear infinite;
				}

				.logo-loader-mark {
					position: relative;
					width: 112px;
					height: 112px;
				}

				@keyframes logo-loader-spin {
					to { transform: rotate(360deg); }
				}

				@media (min-width: 640px) {
					.logo-loader { width: 220px; height: 220px; }
					.logo-loader-ring { border-width: 8px; }
					.logo-loader-mark { width: 144px; height: 144px; }
				}

				/*
				  A continuous spin is exactly the kind of motion that triggers
				  vestibular symptoms, so reduce it to a static ring with the accent
				  arc still visible rather than removing the affordance entirely.
				*/
				@media (prefers-reduced-motion: reduce) {
					.logo-loader-ring { animation: none; }
				}
				`}
			</style>
		</div>
	);
}
