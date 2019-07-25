# Street King
----
Street King is a map based street quiz. It relies on geolocation by the OpenStreetMap project and map tiles from Stamen Design.

It was originally designed and developed for the Manchester Fire Department (Eighth Utilities District) in Manchester, CT. As such, the currently available implementation of it is configured for use by them.


----

## Demo/Live implementation

There is a live implementation available at https://roblevesque.github.io/streetking/

Be aware that this instance is setup for 'production' use in the originally intended department. To modify it for your own use, please see the next section.

## Modifying for use by other departments

Any other department is welcome to either clone the code to their own server or to fork the repo and run it on GitHub pages.

In either case there are two things that *must* be modified to localize it for your own district.

1. In `config.json` you will want to modify the `location` option to fit your location. I'd recommend a similar format to what is already there: 'Town, State Zip Country'
2. Modify `assets/streetlist.json` with a list of streets and cross streets or hints at your pleasure.
  The format for `streetlist.json` is as follows:

```
[
  ["Street Rd","Some hint"],
  ["Street2  Ln","Some hint"],
]
```

*Please note that street names need to match exactly what is listed/shown on OpenStreetMaps.*


## Support
Limited support is available via GitHub issue reports.  I'll do my best to assist but I make no promises or warranties.
Bug reports should also be submitted via the GitHub issue report system.



## Contributing
Please.
