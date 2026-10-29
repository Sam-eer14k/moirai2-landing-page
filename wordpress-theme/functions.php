<?php
/**
 * MoirAI Cloud 2 theme functions.
 *
 * @package MoirAI2
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'MOIRAI2_VERSION', '1.0.0' );

/**
 * Where contact messages go. Change it under Settings > General > "MoirAI contact email".
 * Falls back to support@moiraicloud.ai, the address moiraicloud.ai publishes.
 */
function moirai2_lead_email() {
	$email = get_option( 'moirai2_lead_email' );
	return is_email( $email ) ? $email : 'support@moiraicloud.ai';
}

/**
 * URL of a file inside the theme.
 */
function moirai2_asset( $path ) {
	return esc_url( get_theme_file_uri( $path ) );
}

/* ------------------------------------------------------------------
 * Theme setup
 * ------------------------------------------------------------------ */
function moirai2_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'html5', array( 'search-form', 'gallery', 'caption', 'style', 'script' ) );
}
add_action( 'after_setup_theme', 'moirai2_setup' );

function moirai2_document_title( $title ) {
	if ( is_front_page() ) {
		$title['title']   = 'MoirAI Cloud';
		$title['tagline'] = 'Synaptix™, the AI Infrastructure Operating Platform';
		unset( $title['site'] );
	}
	return $title;
}
add_filter( 'document_title_parts', 'moirai2_document_title' );

function moirai2_title_separator() {
	return '|';
}
add_filter( 'document_title_separator', 'moirai2_title_separator' );

/* ------------------------------------------------------------------
 * Styles and scripts
 * ------------------------------------------------------------------ */
function moirai2_enqueue() {
	wp_enqueue_style(
		'moirai2-fonts',
		'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Urbanist:wght@400..700&display=swap',
		array(),
		null
	);
	wp_enqueue_style( 'moirai2-style', get_stylesheet_uri(), array( 'moirai2-fonts' ), MOIRAI2_VERSION );
	wp_enqueue_script( 'moirai2-main', get_theme_file_uri( 'assets/js/main.js' ), array(), MOIRAI2_VERSION, array( 'in_footer' => true, 'strategy' => 'defer' ) );
}
add_action( 'wp_enqueue_scripts', 'moirai2_enqueue' );

function moirai2_resource_hints( $urls, $relation ) {
	if ( 'preconnect' === $relation ) {
		$urls[] = 'https://fonts.googleapis.com';
		$urls[] = array(
			'href'        => 'https://fonts.gstatic.com',
			'crossorigin' => 'anonymous',
		);
	}
	return $urls;
}
add_filter( 'wp_resource_hints', 'moirai2_resource_hints', 10, 2 );

/* ------------------------------------------------------------------
 * Head: favicons, meta, structured data
 * ------------------------------------------------------------------ */
function moirai2_head_meta() {
	// Theme favicons are used until a Site Icon is set in the Customizer.
	if ( ! has_site_icon() ) {
		?>
		<link rel="icon" href="<?php echo moirai2_asset( 'assets/images/favicon.ico' ); ?>" sizes="any">
		<link rel="icon" type="image/png" sizes="32x32" href="<?php echo moirai2_asset( 'assets/images/favicon-32x32.png' ); ?>">
		<link rel="icon" type="image/png" sizes="16x16" href="<?php echo moirai2_asset( 'assets/images/favicon-16x16.png' ); ?>">
		<link rel="apple-touch-icon" sizes="180x180" href="<?php echo moirai2_asset( 'assets/images/apple-touch-icon.png' ); ?>">
		<?php
	}
	?>
	<meta name="theme-color" content="#F4F6F9">
	<?php
	if ( ! is_front_page() ) {
		return;
	}
	?>
	<meta name="description" content="Run compute, networking, storage and security from one console. Synaptix™ uses AI to trace problems to their cause and recommend a fix that your operators approve. Core platform available today.">
	<meta property="og:site_name" content="MoirAI Cloud">
	<meta property="og:title" content="MoirAI Cloud | Synaptix™ AI infrastructure operations">
	<meta property="og:description" content="One console for compute, networking, storage and monitoring, with AI-assisted operations and operator control. Core platform available now.">
	<meta property="og:type" content="website">
	<meta property="og:image" content="<?php echo moirai2_asset( 'assets/images/android-chrome-512x512.png' ); ?>">
	<meta name="twitter:card" content="summary">
	<meta name="twitter:site" content="@MoirAICloud">
	<script type="application/ld+json">
	<?php
	echo wp_json_encode(
		array(
			'@context'    => 'https://schema.org',
			'@type'       => 'Organization',
			'name'        => 'MoirAI Cloud',
			'url'         => 'https://moiraicloud.ai/',
			'email'       => 'support@moiraicloud.ai',
			'description' => 'Makers of Synaptix™, the AI infrastructure operating platform for data centers, enterprises, regulated and edge environments.',
			'founder'     => array(
				array(
					'@type'    => 'Person',
					'name'     => 'Robert Twitchell',
					'jobTitle' => 'Founder & CEO',
				),
				array(
					'@type'    => 'Person',
					'name'     => 'Daniel Twitchell',
					'jobTitle' => 'Founder & CRO',
				),
			),
			'sameAs'      => array(
				'https://www.linkedin.com/company/moirai-cloud/about/',
				'https://x.com/MoirAICloud',
				'https://www.instagram.com/moirai.cloud/',
			),
		),
		JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
	);
	?>
	</script>
	<?php
}
add_action( 'wp_head', 'moirai2_head_meta', 2 );

/* ------------------------------------------------------------------
 * Settings: contact email field under Settings > General
 * ------------------------------------------------------------------ */
function moirai2_register_settings() {
	register_setting(
		'general',
		'moirai2_lead_email',
		array(
			'type'              => 'string',
			'sanitize_callback' => 'sanitize_email',
			'default'           => '',
		)
	);
	add_settings_field(
		'moirai2_lead_email',
		'MoirAI contact email',
		function () {
			printf(
				'<input type="email" name="moirai2_lead_email" id="moirai2_lead_email" class="regular-text" value="%s"><p class="description">Messages from the front-page form go to this address. Leave blank to use support@moiraicloud.ai.</p>',
				esc_attr( get_option( 'moirai2_lead_email' ) )
			);
		},
		'general'
	);
}
add_action( 'admin_init', 'moirai2_register_settings' );

/* ------------------------------------------------------------------
 * Form handler (admin-post.php)
 * ------------------------------------------------------------------ */
function moirai2_redirect_back( $status ) {
	$url = wp_get_referer() ? wp_get_referer() : home_url( '/' );
	$url = remove_query_arg( 'moirai2', $url );
	$url = preg_replace( '/#.*$/', '', $url );
	wp_safe_redirect( add_query_arg( 'moirai2', $status, $url ) . '#contact' );
	exit;
}

function moirai2_handle_contact() {
	if ( ! isset( $_POST['moirai2_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['moirai2_nonce'] ) ), 'moirai2_contact' ) ) {
		moirai2_redirect_back( 'error' );
	}
	// Honeypot: real visitors never see this field.
	if ( ! empty( $_POST['website'] ) ) {
		moirai2_redirect_back( 'sent' );
	}

	$field = function ( $key ) {
		return isset( $_POST[ $key ] ) ? sanitize_text_field( wp_unslash( $_POST[ $key ] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Missing -- nonce checked above.
	};
	$name        = $field( 'name' );
	$email       = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
	$company     = $field( 'company' );
	$topic       = $field( 'topic' );
	$message     = isset( $_POST['message'] ) ? sanitize_textarea_field( wp_unslash( $_POST['message'] ) ) : '';

	if ( strlen( $name ) < 2 || ! is_email( $email ) || strlen( $message ) < 10 ) {
		moirai2_redirect_back( 'invalid' );
	}

	$body = implode(
		"\n",
		array(
			'Name: ' . $name,
			'Email: ' . $email,
			'Company: ' . ( $company ? $company : 'Not given' ),
			'Working on: ' . ( $topic ? $topic : 'Not given' ),
			'',
			$message,
		)
	);

	$sent = wp_mail(
		moirai2_lead_email(),
		sprintf( 'Synaptix enquiry: %s%s', $name, $company ? ', ' . $company : '' ),
		$body,
		array( 'Reply-To: ' . $name . ' <' . $email . '>' )
	);

	moirai2_redirect_back( $sent ? 'sent' : 'error' );
}
add_action( 'admin_post_nopriv_moirai2_contact', 'moirai2_handle_contact' );
add_action( 'admin_post_moirai2_contact', 'moirai2_handle_contact' );

/**
 * Status message for the form after the redirect.
 *
 * @return array{0:string,1:string} [css class, message]
 */
function moirai2_form_status() {
	$status = isset( $_GET['moirai2'] ) ? sanitize_key( wp_unslash( $_GET['moirai2'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- display only.
	switch ( $status ) {
		case 'sent':
			return array( 'is-ok', 'Thanks. Your message is with our team and we will reply by email.' );
		case 'invalid':
			return array( '', 'Some details were missing. Add your name, a work email and a line about what you run, then send again.' );
		case 'error':
			return array( '', 'That did not go through. Please email support@moiraicloud.ai instead.' );
	}
	return array( '', '' );
}
