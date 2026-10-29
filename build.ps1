# Builds index.html (single file, CSS and JS inline) at the repo root and the
# WordPress theme from the sources in src/. Run:
#
#   powershell -ExecutionPolicy Bypass -File build.ps1
#
# Edit src/_head.html, src/_body.html, src/css/theme.css or src/js/main.js.
# Never edit index.html or the theme's style.css, front-page.php or main.js:
# they are generated and will be overwritten.
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$src = Join-Path $root 'src'
$utf8 = New-Object System.Text.UTF8Encoding($false)

# The inbox the static contact form opens in the visitor's email app.
# support@moiraicloud.ai is the address moiraicloud.ai publishes.
# The WordPress theme sends real email instead (see functions.php).
$LeadEmail = 'support@moiraicloud.ai'

function Read-Src($name) { [IO.File]::ReadAllText((Join-Path $src $name), $utf8) }
function Write-Out($path, $text) {
  $dir = Split-Path $path
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force $dir | Out-Null }
  [IO.File]::WriteAllText($path, $text.Replace("`r`n", "`n"), $utf8)
}

$head = Read-Src '_head.html'
$body = Read-Src '_body.html'
$css  = Read-Src 'css\theme.css'
$js   = Read-Src 'js\main.js'

# House style: no em or en dashes in page copy.
$dashes = '[' + [char]0x2013 + [char]0x2014 + ']'
if ($body -match $dashes) { throw 'An em or en dash is in _body.html' }
if ($body -match '<video') { throw 'The brief asks for no video anywhere on the page' }
# Only the logo and the founder photos may be raster images; every other visual is SVG/CSS/JS.
foreach ($m in [regex]::Matches($body, 'images/([a-z0-9-]+\.(webp|jpg|jpeg|png))')) {
  if ($m.Groups[1].Value -notmatch '^(logo-h41|logo-h82|robert-twitchell|daniel-twitchell)\.') { throw "Image not allowed on the page: $($m.Groups[1].Value)" }
}

# Urbanist draws the trademark sign as full-size "TM", so in text (never inside
# attributes) it becomes a small superscript.
$body = [regex]::Replace($body, '(?<=>[^<>]*)' + [char]0x2122, '<sup class="tm">&#8482;</sup>')

# Conservative minifiers for the copy inlined into index.html (src/ stays readable).
function Minify-Css($s) {
  $s = [regex]::Replace($s, '(?s)/\*.*?\*/', '')
  $s = [regex]::Replace($s, '\s+', ' ')
  $s = [regex]::Replace($s, '\s*([{};,>])\s*', '$1')
  $s = [regex]::Replace($s, '([^\s(]):\s+', '$1:')
  $s = $s.Replace(';}', '}')
  return $s.Trim()
}
# JS: drop block comments, whole-line // comments, indentation and blank lines.
# Line breaks are kept so automatic semicolon insertion can't change behaviour.
function Minify-Js($s) {
  $s = [regex]::Replace($s, '(?s)/\*.*?\*/', '')
  $lines = $s -split "`r?`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -and -not $_.StartsWith('//') }
  return ($lines -join "`n")
}

# Sanity check: an unbalanced quote in the CSS silently drops every rule after it.
if ((([regex]::Matches($css, '"')).Count % 2) -ne 0) { throw 'theme.css has an odd number of double quotes' }

$cssMin = Minify-Css $css
$jsMin  = Minify-Js $js

# ---------------- static HTML ----------------
$htmlBody = $body.Replace('{{A}}', 'assets/').Replace('{{FORM_ACTION}}', "mailto:$LeadEmail").Replace('{{FORM_MODE}}', 'mailto')
$htmlBody = [regex]::Replace($htmlBody, '<!--WP:[a-z-]+-->', '')
$html = "<!doctype html>`n<html lang=""en"">`n<head>`n$head<style>$cssMin</style>`n</head>`n<body>`n$htmlBody`n<script>`n$jsMin`n</script>`n</body>`n</html>`n"
Write-Out (Join-Path $root 'index.html') $html
"index.html  $([math]::Round($html.Length / 1KB)) KB"

# ---------------- WordPress theme ----------------
$theme = Join-Path $root 'wordpress-theme'

$styleHeader = @'
/*
Theme Name: MoirAI Cloud 2
Author: Zaphyre
Description: One-page landing theme for MoirAI Cloud, makers of Synaptix, the AI infrastructure operating platform. Layout mirrors the AgenIO AI-agency home. Set a static front page under Settings > Reading.
Version: 1.0.0
Requires at least: 6.0
Requires PHP: 7.4
License: GNU General Public License v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Text Domain: moirai2
*/

/* WordPress admin bar offset for the sticky header. */
body.admin-bar .head { top: 32px; }
@media screen and (max-width: 782px) { body.admin-bar .head { top: 46px; } }
@media screen and (max-width: 600px) { body.admin-bar .head { top: 0; } }

'@
Write-Out (Join-Path $theme 'style.css') ($styleHeader + $css)
Write-Out (Join-Path $theme 'assets\js\main.js') $js

$wp = $body.Replace('{{A}}', '<?php echo esc_url( $moirai2_a ); ?>')
$wp = $wp.Replace('action="{{FORM_ACTION}}"', 'action="<?php echo esc_url( admin_url( ''admin-post.php'' ) ); ?>"')
$wp = $wp.Replace('data-mode="{{FORM_MODE}}"', 'data-mode="wp"')
$wp = $wp.Replace('<!--WP:contact-fields-->', '<input type="hidden" name="action" value="moirai2_contact"><?php wp_nonce_field( ''moirai2_contact'', ''moirai2_nonce'' ); ?>')
$wp = $wp.Replace('<!--WP:contact-status-->', '<?php echo esc_html( $moirai2_status[1] ); ?>')
$wp = $wp.Replace('class="form__status" id="form-status"', 'class="form__status <?php echo esc_attr( $moirai2_status[0] ); ?>" id="form-status"')
$wp = $wp.Replace('<span data-year>2026</span>', '<span data-year><?php echo esc_html( wp_date( ''Y'' ) ); ?></span>')
if ($wp -match '<!--WP:') { throw 'Unreplaced WP marker in body' }
if ($wp -match '\{\{') { throw 'Unreplaced {{ }} placeholder in body' }

$frontPage = @'
<?php
/**
 * Front page. Generated by build.ps1 from src/_body.html: edit the source, not this file.
 *
 * @package MoirAI2
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$moirai2_a      = trailingslashit( get_theme_file_uri( 'assets' ) );
$moirai2_status = moirai2_form_status();
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

'@ + $wp + @'

<?php wp_footer(); ?>
</body>
</html>

'@
Write-Out (Join-Path $theme 'front-page.php') $frontPage

# Mirror assets/images so files removed from assets/ also leave the theme.
$from = Join-Path $root 'assets\images'
$dst = Join-Path $theme 'assets\images'
if (Test-Path $dst) { Remove-Item $dst -Recurse -Force }
New-Item -ItemType Directory -Force $dst | Out-Null
Copy-Item (Join-Path $from '*') $dst -Force
"wordpress-theme regenerated"
