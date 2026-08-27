<?php

/**
 * @file
 * Applies a recipe by directory path using the core Recipe API.
 *
 * Test-only helper run via `drush php:script` so the browser-test setup can
 * apply the hidden test recipe on every supported version - Drush 13 still
 * ships a `recipe` command, but Drush 14 (Drupal 12) removed it, and the core
 * `dr` CLI is awkward to invoke from CI. The Recipe API is stable across all of
 * them.
 *
 * Usage:
 *   drush php:script apply-test-recipe.php -- /absolute/path/to/recipe
 */

use Drupal\Core\Recipe\Recipe;
use Drupal\Core\Recipe\RecipeRunner;

$path = $extra[0] ?? '';
if ($path === '' || !is_dir($path)) {
  throw new \RuntimeException("Recipe directory not found: '$path'");
}

RecipeRunner::processRecipe(Recipe::createFromDirectory($path));
print "Applied recipe: $path\n";
