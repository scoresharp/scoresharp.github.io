# Score Sharp

This repository is a small project focused on music education and creation. By splitting it in a few different catagories.

1. Theory
1. Skill
1. Composition

## Theory

Having no music related background of any kind. Anything music related is a theory education for myself. So this is a part others could contribute or it will be created once my own knowledge has reached a certain critical mass.

## Skill

By providing interactive practicing tools certain physical skill can be trained by repetition and imitation. This has a heavy focus on ```MIDI``` and potentially ```audio``` for checking certain level of accuracy. As ```MIDI``` is the most straight forward technology to integrate with that will be the main focus until adequate ```audio``` based checks are available.

## Composition

Where the other topics are focused on providing a certain level of restriction. The composition layer should be a free and block as little as possible to produce own creations. By using functionalities of the other blocks creating a unified experience and allowing learned skills from other tools to be directly applied inside the composition layer. For example accepting direct ```MIDI``` streams and using references from the theory to import snippets directly into a composition. The core user experience principle to include in all design decisions is to reduce repetitions. Accepting a steeper learning curve to allow more long term efficiency. Making repetitive tasks automatic or at most single clicks with certain key combinations.

## Architecture

As one of my targets is to allow free access to anyone the most important bottleneck would be hosting. Therefor the whole architecture is static sources being hosted by ```github.io``` pages. Making all the dynamic logic run inside the browser. While larger task can be run inside CI jobs to provide static access to the results for the browser to consume. This allows for the most optimal scaling possible while also being free of use.
