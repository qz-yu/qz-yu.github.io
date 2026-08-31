---
layout: page
title: Gallery
kicker: Visual notebook
intro: Selected frames from observing runs, conferences, and places encountered along the way.
body_class: gallery-page
permalink: /gallery/
description: A visual notebook by Qingzheng Yu.
---

{% assign gallery_items = site.data.gallery.photos %}
{% if gallery_items and gallery_items.size > 0 %}
<div class="gallery-grid">
  {% for photo in gallery_items %}
  <figure class="gallery-item gallery-item-{{ photo.size | default: 'standard' }}">
    <img src="{{ photo.src | relative_url }}" alt="{{ photo.alt }}" loading="lazy">
    <figcaption>
      <span>{{ photo.caption }}</span>
      {% if photo.location or photo.date %}<small>{{ photo.location }}{% if photo.location and photo.date %} · {% endif %}{{ photo.date }}</small>{% endif %}
    </figcaption>
  </figure>
  {% endfor %}
</div>
{% else %}
<section class="gallery-empty">
  <div class="gallery-contact-sheet" aria-hidden="true">
    <div class="photo-cell photo-cell-one"></div>
    <div class="photo-cell photo-cell-two"></div>
    <div class="photo-cell photo-cell-three"></div>
    <div class="photo-cell photo-cell-four"></div>
    <div class="photo-cell photo-cell-five"></div>
  </div>
  <div class="gallery-empty-copy">
    <p class="eyebrow">In preparation</p>
    <h2>A more personal view of the work.</h2>
    <p>I am curating a small collection rather than mirroring a full photo archive. The page is ready for selected albums and will be expanded with Google Photos content in a later update.</p>
  </div>
</section>
{% endif %}
