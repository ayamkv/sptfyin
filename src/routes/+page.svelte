<script>
    import { Button } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import { Switch } from "$lib/components/ui/switch";
    import { Input } from "$lib/components/ui/input";
    import * as Select from "$lib/components/ui/select/index.js";
    import { Label } from "$lib/components/ui/label";
    import { Separator } from "$lib/components/ui/separator";
    import * as Accordion from "$lib/components/ui/accordion";
    import 'iconify-icon';
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import { strings } from "$lib/localization/languages/en.json"
    import { onMount } from "svelte";
    // These variables will be undefined during SSR
    let isIOS, isAndroid, isMobile, isSafari, isFirefox, isOldFirefox;

    // This function will only run in the browser
    onMount(() => {
        const ua = navigator.userAgent.toLowerCase();
        isIOS = ua.includes("iphone os") || (ua.includes("mac os") && navigator.maxTouchPoints > 0);
        isAndroid = ua.includes("android");
        isMobile = ua.includes("android") || isIOS;
        isSafari = ua.includes("safari/");
        isFirefox = ua.includes("firefox/");
        isOldFirefox = ua.includes("firefox/") && ua.split("firefox/")[1].split('.')[0] < 103;
    });

    let inputText
    let isError = false;
    let alertDialogTitle = ''
    let alertDialogDescription = ''
    let errorIconDefault = 'fluent-emoji:crying-cat'
    let errorIcon = errorIconDefault
    let focus1 = false;
    let theButton

    function findUrl(str) {
        const regex = /^(https:\/\/[a-z]+\.spotify\.com\/)(.*)$/mg;
        let urls = str.match(regex);
        return urls ? urls[0] : null;
    }

    async function handlePaste(event) {
    try {
      // Request permission to access the clipboard
      const permission = await navigator.permissions.query({ name: 'clipboard-read' });

      if (permission.state === 'granted' || permission.state === 'prompt') {
        // Read from the clipboard
        const text = await navigator.clipboard.readText();
        let clipboardContent = text;

        // console.log(clipboardContent);
        // console.log(findUrl(clipboardContent));
        setTimeout(() => {
        inputText = findUrl(clipboardContent);

        

        if (inputText === null) {
          setTimeout(() => {
            focus1 = false;
            // alert('No Spotify URL found in clipboard');
            isError = true;
            alertDialogTitle = strings.ErrorClipboardNoSpotifyURLTitle;
            alertDialogDescription = strings.ErrorClipboardNoSpotifyURLDesc;
            errorIcon = strings.ErrorClipboardNoSpotifyURLIcon;
            console.log(alertDialogTitle, alertDialogDescription)
          }, 1);
        }
        focus1 = true;
        
        }, 4);
      } else {
        errorIcon = errorIconDefault;
        alertDialogTitle = strings.ErrorClipboardPermTitle;
        alertDialogDescription = strings.ErrorClipboardPermissionDesc;
        isError = true;
        // alert('Clipboard access denied');
      }
    } catch (e) {
      let error = String(e).toLowerCase();

      if (error.includes("denied")) isError = true;
      console.error('Failed to read clipboard: ', error);
      if (error.includes("function") && isFirefox) alert('Firefox does not support clipboard access');
      if (error.includes("dismissed") || isIOS) alert('Sorry! iOS Safari does not support clipboard access 😔');
    }
  }
  
    // onMount(() => {
    //     console.log(strings)
    // });
    function escapeSelectHandle() {
        onMount(() => { 
          setTimeout(() => {
            theButton.focus()
          }, 40);
        });
        console.log('something is selected');
    }

    // onMount(() => {
    //   escapeSelectHandle();
    // })


    let selected = { value: "sptfy.in", label: "Default: sptfy.in"}
    const domainList = [
    { value: "sptfy.in", label: "sptfy.in" },
    { value: "profile.sptfy.in", label: "profile.sptfy.in" },
    { value: "playlist.sptfy.in", label: "playlist.sptfy.in" },
    { value: "podcast.sptfy.in", label: "podcast.sptfy.in" },
    { value: "album.sptfy.in", label: "album.sptfy.in" },
    { value: "track.sptfy.in", label: "track.sptfy.in" },
    { value: "artist.sptfy.in", label: "artist.sptfy.in" }

  ];
</script>




<AlertDialog.Root bind:open={isError} class="transition-all">
  <AlertDialog.Trigger></AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <iconify-icon icon={errorIcon} class="block m-auto text-center" width=120></iconify-icon>
      <AlertDialog.Title class="text-center">Ouch! {@html alertDialogTitle}</AlertDialog.Title>
      
      <AlertDialog.Description>
          {@html alertDialogDescription}
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Action class="min-w-full font-semibold" on:click={() => isError = false}>okay, got it</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<div class="flex flex-col items-center justify-center">
  <h1 class="text-8xl font-bold text-primary font-jak-display ss03 md:flex-none hidden md:block translate-y-[12rem]">Sptfy.in</h1>
</div>

<div class="flex flex-col items-center justify-center min-h-screen gap-6 p-10 -translate-y-8 md:flex-row md:items-start md:translate-y-[12.5rem]">
  <h1 class="text-6xl font-bold text-primary font-jak-display ss03 md:flex-none md:hidden">Sptfy.in</h1>
    <Card.Root class="w-[20rem] md:w-[35rem] sm:w-[20rem] transition-all">
        <Card.Header>
          <Card.Title>Shorten your URL</Card.Title>
          <Card.Description>Make your Spotify URLs looks pretty with one click, easy and fast!</Card.Description>
        </Card.Header>
        <Card.Content class="grid gap-4">
          
           
      
            <!-- <div class="flex-1 space-y-1">
              <p class="text-sm font-medium leading-none">Push Notifications</p>
              <p class="text-sm text-muted-foreground">
                Send notifications to device.
              </p>
            </div> -->
         
      
          <div>
            <form class="flex flex-col w-full min-w-full">
                <Label for="url" class="my-2">Paste your long ass URL here</Label>
                <div class="flex w-full min-w-full items-center align-center space-x-3 mb-2">
                    
                    <Input type="url" id="url" on:paste={handlePaste} placeholder="https://open.spotify.com/xxxx...." bind:value={inputText} class="placeholder:translate-y-[2px]" autofocus />
                    <Button type="paste" class="hover:bg-primary hover:text-black" variant="secondary" on:click={() => handlePaste()}><iconify-icon width="20" icon="lucide:clipboard-copy"></iconify-icon></Button>
                </div>
                
                <Label for="domainSelect" class="my-2">Select domain</Label>
                <Select.Root portal={null} id="domainSelect" name="domainSelect" bind:selected bind:open={focus1} asChild>
                    <Select.Trigger class="">
                      <Select.Value placeholder="Domain: sptfy.in" selected="sptfy.in" />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Group>
                        <Select.Label>Select domain</Select.Label>
                        {#each domainList as domain}
                          <Select.Item value={domain.value} label={domain.label} on:click={() => escapeSelectHandle()}
                            >{domain.label}</Select.Item
                          >
                        {/each}
                      </Select.Group>
                    </Select.Content>
                    <Select.Input name="sptfy.in"/>
                  </Select.Root>
                  <!-- <Separator class="my-2"/> -->
                  <Accordion.Root class="">
                    <Accordion.Item value="item-1" class>
                      <Accordion.Trigger>Custom Short URL (Optional)</Accordion.Trigger>
                      <Accordion.Content>
                        <Label for="url" class="my-2">Custom URL here</Label>
                        <div class="flex flex-col w-full min-w-full items-center space-x-2 mb-2">
                            
                            <Input type="text" id="short_id" placeholder="myCoolPlaylistNo4..." />
                            
                           
                        </div>


                      </Accordion.Content>
                    </Accordion.Item>
                  </Accordion.Root>
                  
              </form>
          </div>
        </Card.Content>
        <Card.Footer class="flex-col">
         
          <Button class="w-full" bind:this={theButton}>
           
              Short It!
      

          </Button>

          
        </Card.Footer>
      </Card.Root>
      <Card.Root class="w-[20rem] md:w-[35rem] sm:w-[20rem]  transition-all">
        <Card.Header>
          <Card.Title>URL Preview</Card.Title>
          <Card.Description>Here's how your URL will look like</Card.Description>
          <Card.Content class="grid gap-4 text-[#82d1af]/60 text-left px-0 pb-0">
            <div class="flex w-full min-w-full items-center align-center justify-between md:py-2 ">
              <p class="text-2xl md:text-3xl lg:text-5xl font-semibold ">sptfy.in/<span class="text-[#82d1af]">####</span></p>
              <Button variant="secondary" class="hover:bg-primary hover:text-black p-3" >
                  <iconify-icon icon="lucide:copy" class="" width="24">
                </iconify-icon>
              </Button>
            </div>
          </Card.Content>
        </Card.Header>
        </Card.Root>
          
</div>
